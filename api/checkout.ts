import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:5173";

const PRICE_IDS: Record<string, string> = {
  estudante:    process.env.STRIPE_PRICE_ESTUDANTE ?? "",
  pesquisador:  process.env.STRIPE_PRICE_PESQUISADOR ?? "",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!STRIPE_SECRET) {
    return res.status(503).json({ error: "Pagamentos não configurados neste ambiente." });
  }

  const { plan, userId, email } = req.body as {
    plan: string;
    userId?: string;
    email?: string;
  };

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return res.status(400).json({ error: `Plano inválido: ${plan}` });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2025-03-31.basil" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${BASE_URL}/?checkout=success&plan=${plan}`,
      cancel_url:  `${BASE_URL}/?checkout=cancelled`,
      customer_email: email,
      metadata: { userId: userId ?? "", plan },
      locale: "pt-BR",
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("[api/checkout] Stripe error:", err?.message);
    return res.status(500).json({ error: "Erro ao criar sessão de pagamento." });
  }
}

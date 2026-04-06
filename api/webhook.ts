import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET    = process.env.STRIPE_SECRET_KEY ?? "";
const WEBHOOK_SECRET   = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const SUPABASE_URL     = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Uses service role key (server-side only) to bypass RLS
function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE);
}

export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (!STRIPE_SECRET || !WEBHOOK_SECRET) {
    return res.status(503).json({ error: "Webhook não configurado" });
  }

  const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2025-03-31.basil" });
  const rawBody = await readRawBody(req);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan   = session.metadata?.plan as "estudante" | "pesquisador" | undefined;

    if (userId && plan) {
      const db = getSupabaseAdmin();
      if (db) {
        const { error } = await db
          .from("profiles")
          .update({ plan, searches_today: 0, searches_reset_at: new Date().toISOString() })
          .eq("id", userId);
        if (error) console.error("[webhook] Supabase update error:", error.message);
        else console.log(`[webhook] Plan upgraded: user=${userId} plan=${plan}`);
      }
    }
  }

  return res.status(200).json({ received: true });
}

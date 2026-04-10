import type { VercelRequest, VercelResponse } from "@vercel/node";

const DISCORD_WEBHOOK = process.env.DISCORD_FEEDBACK_WEBHOOK ?? "";

const TYPE_EMOJI: Record<string, string> = {
  bug: "🐛",
  sugestao: "💡",
  outro: "💬",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { type, message, email } = req.body ?? {};
  if (!message?.trim()) return res.status(400).json({ error: "Mensagem obrigatória" });

  if (!DISCORD_WEBHOOK) return res.status(500).json({ error: "Webhook não configurado" });

  const emoji = TYPE_EMOJI[type] ?? "💬";
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const payload = {
    embeds: [
      {
        title: `${emoji} Feedback — ${type ?? "outro"}`,
        description: message,
        color: type === "bug" ? 0xe74c3c : type === "sugestao" ? 0xf39c12 : 0x3498db,
        fields: [
          { name: "E-mail", value: email?.trim() || "não informado", inline: true },
          { name: "Horário (BRT)", value: now, inline: true },
        ],
        footer: { text: "Emerald Scholar · Feedback" },
      },
    ],
  };

  const discordRes = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!discordRes.ok) return res.status(502).json({ error: "Falha ao enviar para Discord" });
  return res.status(200).json({ ok: true });
}

import type { VercelRequest, VercelResponse } from "@vercel/node";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5-free";

interface ArticleInput {
  title: string;
  authors: string;
  year: string;
  study_type: string;
  citations: number;
  abstract_pt: string;
  source: string;
}

const SYSTEM_PROMPT = `Você é um assistente de pesquisa científica especializado em síntese de evidências.
Recebe uma lista de artigos científicos e uma query de pesquisa, e retorna uma síntese estruturada em JSON.
Responda APENAS com JSON válido, sem markdown, sem explicações fora do JSON.`;

function buildUserPrompt(query: string, articles: ArticleInput[]): string {
  const articlesSummary = articles
    .slice(0, 12)
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title} (${a.authors}, ${a.year}) — ${a.study_type}, ${a.citations} citações, fonte: ${a.source}\nAbstract: ${a.abstract_pt?.slice(0, 400) ?? "N/A"}`
    )
    .join("\n\n");

  const isQuestion = query.includes("?");

  return `Query de pesquisa: "${query}"

Artigos encontrados:
${articlesSummary}

${
  isQuestion
    ? `Como esta é uma pergunta de pesquisa, calcule as porcentagens de consenso:
- consensus_agree: % dos estudos que respondem SIM / confirmam a proposição (0-100)
- consensus_inconclusive: % inconclusivos (0-100)
- consensus_contradict: % que contradizem (0-100)
Os três devem somar exatamente 100.`
    : `Como esta é uma busca temática (não uma pergunta), use:
- consensus_agree: 0
- consensus_inconclusive: 100
- consensus_contradict: 0`
}

Retorne APENAS este JSON (sem markdown):
{
  "direct_answer": "Síntese direta em português (2-3 frases), mencionando os estudos mais relevantes. Comece com 'Com base em X estudos analisados —'",
  "consensus_agree": number,
  "consensus_inconclusive": number,
  "consensus_contradict": number,
  "confidence_level": "alta" | "média" | "baixa",
  "confidence_score": number (40-95),
  "confidence_reasons": ["razão 1 sobre qualidade metodológica", "razão 2", "razão 3"],
  "inconclusive_summary": "O que ainda está em debate ou sem conclusão",
  "contradict_explanation": "O que os estudos contrários argumentam (vazio se consensus_contradict=0)",
  "practical_insight": "Aplicação prática para pesquisa acadêmica",
  "search_tip": "Sugestão de termos mais específicos para refinar a busca",
  "maturity_label": "Consenso consolidado" | "Debate ativo" | "Evidência emergente" | "Campo controverso"
}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST")
    return res.status(405).json({ error: "Método não permitido" });

  const { query, articles } = req.body as {
    query: string;
    articles: ArticleInput[];
  };

  if (!query || !articles?.length)
    return res.status(400).json({ error: "query e articles são obrigatórios" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: "OPENROUTER_API_KEY não configurada" });

  try {
    const orRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://scholaria.vercel.app",
        "X-Title": "ScholarIA",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(query, articles) },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      throw new Error(`OpenRouter ${orRes.status}: ${errText}`);
    }

    const orData = await orRes.json();
    const raw = orData.choices?.[0]?.message?.content ?? "{}";

    // Limpar possível markdown do modelo
    const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    const synthesis = JSON.parse(cleaned);

    return res.status(200).json({ synthesis });
  } catch (err) {
    console.error("[api/summarize]", err);
    return res.status(500).json({
      error: "Falha ao gerar síntese",
      details: String(err),
    });
  }
}

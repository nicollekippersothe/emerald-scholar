import type { VercelRequest, VercelResponse } from "@vercel/node";

// Aumenta timeout da função Vercel de 10s → 60s
export const config = { maxDuration: 60 };

// ─── Config ──────────────────────────────────────────────────────────────────
// Prioridade: GOOGLE_AI_KEY (gratuito, 1500 req/dia) → OPENROUTER_API_KEY
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemma-3-12b-it:free";

// Fallback chain de modelos :free caso o principal esteja rate-limited
const FREE_MODEL_FALLBACKS = [
  "google/gemma-3-12b-it:free",
  "google/gemma-3n-e4b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

// Google AI Studio endpoint (Gemini 1.5 Flash — gratuito)
const GOOGLE_AI_URL = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
const GOOGLE_MODEL = "gemini-1.5-flash";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ArticleInput {
  title: string;
  authors: string;
  year: string;
  study_type: string;
  citations: number;
  abstract_pt: string;
  source: string;
  doi?: string;
  journal?: string;
}

// ─── Prompts ─────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é um Professor Doutor especialista em síntese de evidências científicas, com vasta experiência em revisões sistemáticas e meta-análises. Sua missão é gerar sínteses de nível acadêmico, claras, rigorosas e acessíveis.

Regras absolutas:
- Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON.
- Toda síntese deve ser em Português do Brasil (PT-BR) fluído e científico.
- Seja direto, preciso e nunca invente dados que não estejam nos abstracts fornecidos.
- Em inline_synthesis: aponte divergências explicitamente ("Embora [N] aponte X, [M] sugere Y").`;

function classifyVenue(a: ArticleInput): "journal" | "conference" | "preprint" | "other" {
  if (a.source === "arXiv" || a.journal?.toLowerCase().includes("arxiv")) return "preprint";
  if (a.journal?.toLowerCase().includes("conference") || a.journal?.toLowerCase().includes("proceedings")) return "conference";
  if (a.source === "BASE" && !a.journal) return "other";
  return "journal";
}

function buildUserPrompt(query: string, articles: ArticleInput[]): string {
  // Limitar a 8 artigos para caber no contexto e reduzir latência
  const top8 = articles.slice(0, 8);

  const articlesList = top8
    .map((a, i) => {
      const venueType = classifyVenue(a);
      const venueTag =
        venueType === "journal" ? "Periódico" :
        venueType === "conference" ? "Conferência" :
        venueType === "preprint" ? "Preprint" : "Outro";
      const venue = a.journal ? ` | ${a.journal}` : "";
      const doiKey = a.doi && a.doi !== "n/a" ? a.doi : `n/a-${i + 1}`;
      const abstract = a.abstract_pt?.slice(0, 400) ?? "N/A";
      return `[${i + 1}] chave:"${doiKey}" | ${a.title} (${a.authors}, ${a.year}) — ${a.study_type}, ${a.citations} cit., ${a.source}${venue} [${venueTag}]\nAbstract: ${abstract}`;
    })
    .join("\n\n");

  const isQuestion = query.includes("?");

  return `Query de pesquisa: "${query}"

Artigos (priorize Periódicos peer-reviewed; sinalize Preprints com menor peso):
${articlesList}

${
  isQuestion
    ? `Calcule as porcentagens de consenso (devem somar 100):
- consensus_agree: % que confirmam a proposição
- consensus_inconclusive: % inconclusivos
- consensus_contradict: % que contradizem`
    : `Busca temática: consensus_agree:0, consensus_inconclusive:100, consensus_contradict:0`
}

Retorne APENAS este JSON sem markdown:
{
  "direct_answer": "Síntese direta em PT-BR (2-3 frases). Comece com 'Com base em X estudos analisados —'",
  "inline_synthesis": "Parágrafo único de síntese científica (5-8 frases). Sintetize o que há de COMUM. Quando houver divergência, aponte: 'Embora [N] aponte X, [M] sugere Y'. Cada afirmação com citação [N]. 100% PT-BR fluído.",
  "article_summaries": {
    "CHAVE_DO_ARTIGO": {
      "resumo_tecnico": "Tipo de estudo, N amostral, metodologia, resultados estatísticos (p-valor, HR se disponível), conclusão. Terminologia acadêmica. 2-4 frases.",
      "resumo_popular": "Linguagem simples. O que investigou, o que descobriu, por que importa no dia a dia. 2-3 frases.",
      "evidence_level_badge": "Uma opção: Meta-análise | Revisão Sistemática | Ensaio Clínico Randomizado | Estudo de Coorte | Estudo Transversal | Estudo Caso-Controle | Relato de Caso | Preprint não revisado | Revisão Narrativa | Estudo Observacional"
    }
  },
  "cited_sources": [{"index":1,"title":"título","doi":"doi ou n/a","citations":0,"venue_type":"journal","evidence_level":"Meta-análise · Lancet 2023","year":"2023","authors":"Autor et al."}],
  "consensus_agree": 0,
  "consensus_inconclusive": 100,
  "consensus_contradict": 0,
  "confidence_level": "alta",
  "confidence_score": 75,
  "confidence_reasons": ["razão sobre QUALIDADE metodológica", "razão 2", "razão 3"],
  "inconclusive_summary": "O que ainda está em debate",
  "contradict_explanation": "",
  "practical_insight": "Aplicação prática para pesquisadores",
  "search_tip": "Termos MeSH ou operadores booleanos para refinar",
  "maturity_label": "Consenso consolidado",
  "study_recortes": ["Estudo [autor, ano]: achado com n, p-valor"],
  "resumos_pt": {"CHAVE": "Resumo 1-2 frases em PT."}
}

CRÍTICO: article_summaries deve ter uma entrada para CADA um dos ${top8.length} artigos listados, usando a "chave" exata. inline_synthesis mínimo 5 frases com citações [N].`;
}

// ─── Chamar Google AI Studio (Gemini) ────────────────────────────────────────
async function callGoogleAI(prompt: string): Promise<string> {
  const key = GOOGLE_AI_KEY!;
  const res = await fetch(GOOGLE_AI_URL(GOOGLE_MODEL, key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
}

// ─── Chamar OpenRouter (com fallback chain para modelos :free) ────────────────
async function callOpenRouter(prompt: string): Promise<string> {
  // Monta lista: modelo configurado primeiro, depois os fallbacks (sem duplicata)
  const modelsToTry = [
    OPENROUTER_MODEL,
    ...FREE_MODEL_FALLBACKS.filter((m) => m !== OPENROUTER_MODEL),
  ];

  let lastError = "";
  for (const model of modelsToTry) {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://scholaria.vercel.app",
        "X-Title": "ScholarIA",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.25,
        max_tokens: 4000,
      }),
    });

    if (res.status === 429) {
      // Rate limited — tenta próximo modelo
      console.warn(`[api/summarize] ${model} rate-limited, tentando próximo...`);
      lastError = `429 rate-limited`;
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter ${res.status} (${model}): ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log(`[api/summarize] sucesso com modelo: ${model}`);
      return content;
    }
  }

  throw new Error(`Todos os modelos OpenRouter falharam (${lastError}). Configure GOOGLE_AI_KEY para síntese confiável.`);
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { query, articles } = req.body as { query: string; articles: ArticleInput[] };
  if (!query || !articles?.length)
    return res.status(400).json({ error: "query e articles são obrigatórios" });

  if (!GOOGLE_AI_KEY && !OPENROUTER_API_KEY)
    return res.status(500).json({ error: "Nenhuma chave de API configurada (GOOGLE_AI_KEY ou OPENROUTER_API_KEY)" });

  try {
    const prompt = buildUserPrompt(query, articles);

    // Tenta Google AI primeiro (gratuito), fallback para OpenRouter
    let raw: string;
    if (GOOGLE_AI_KEY) {
      console.log("[api/summarize] usando Google AI Studio");
      raw = await callGoogleAI(prompt);
    } else {
      console.log("[api/summarize] usando OpenRouter");
      raw = await callOpenRouter(prompt);
    }

    // Limpar possível markdown residual
    const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    const synthesis = JSON.parse(cleaned);

    return res.status(200).json({ synthesis });
  } catch (err) {
    console.error("[api/summarize]", err);
    return res.status(500).json({ error: "Falha ao gerar síntese", details: String(err) });
  }
}

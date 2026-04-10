import type { VercelRequest, VercelResponse } from "@vercel/node";

// Aumenta timeout da função Vercel de 10s → 60s
export const config = { maxDuration: 60 };

// ─── Config ──────────────────────────────────────────────────────────────────
// Prioridade: GROQ_API_KEY → GOOGLE_AI_KEY → OPENROUTER_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? "google/gemma-3-12b-it:free";

// Groq — 14.400 req/dia grátis, muito rápido
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// 8b-instant primeiro: mais rápido e não conflita com o 70b usado nos abstracts
const GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "gemma2-9b-it",
];

// Google AI Studio endpoint (Gemini 2.0 Flash — gratuito)
const GOOGLE_AI_URL = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
const GOOGLE_MODEL = "gemini-2.0-flash";

// OpenRouter fallback chain
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FREE_MODEL_FALLBACKS = [
  "google/gemma-3n-e4b-it:free",
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

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
  /** TL;DR do Semantic Scholar — resumo de 1-2 frases baseado no paper real */
  tldr?: string;
}

// ─── Prompts ─────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é um Professor Doutor especialista em síntese de evidências científicas, com vasta experiência em revisões sistemáticas e meta-análises. Sua missão é gerar sínteses de nível acadêmico, claras, rigorosas e acessíveis.

Regras absolutas:
- Responda APENAS com JSON válido, sem markdown, sem texto fora do JSON.
- Toda síntese deve ser em Português do Brasil (PT-BR) fluído e científico.
- NUNCA invente achados, resultados ou conclusões que não estejam explicitamente descritos no abstract fornecido.
- Se o abstract de um artigo for "Abstract não disponível.", "N/A" ou tiver menos de 60 caracteres: os campos resumo_popular e resumo_tecnico devem reconhecer isso explicitamente — não deduza achados a partir do título.
- Em inline_synthesis: aponte divergências explicitamente ("Embora [N] aponte X, [M] sugere Y").
- title_pt: traduza o título para PT-BR de forma fiel. Se já estiver em português, repita o mesmo texto.`;

// ─── ICM programático (não deixar a IA adivinhar) ────────────────────────────

const STUDY_SCORES: Record<string, number> = {
  "meta-análise": 100,
  "revisão sistemática": 85,
  "ensaio clínico randomizado": 75,
  "coorte": 65,
  "estudo observacional": 50,
  "relato de caso": 35,
  "revisão narrativa": 40,
  "preprint": 30,
};

const SOURCE_SCORES: Record<string, number> = {
  "Cochrane": 95,
  "PubMed": 90,
  "Semantic Scholar": 85,
  "OpenAlex": 80,
  "CrossRef": 80,
  "DOAJ": 75,
  "SciELO": 75,
  "Europe PMC": 75,
  "BVS/LILACS": 70,
  "CORE": 70,
  "Lens.org": 70,
  "BASE": 65,
  "arXiv": 55,
};

function computeICM(articles: ArticleInput[]): number {
  if (articles.length === 0) return 50;
  const top = articles.slice(0, 8);
  const baseScore = top.reduce((sum, a) => {
    const ts = STUDY_SCORES[a.study_type] ?? 50;
    const ss = SOURCE_SCORES[a.source] ?? 65;
    const peerBonus = ts >= 65 ? 10 : 0;
    // Citações: paper com 200+ cit. recebe pontuação máxima (200 → 100pts)
    const citW = Math.min(100, Math.floor(a.citations / 2));
    // Recência: publicações recentes têm mais impacto
    const yr = parseInt(a.year) || 2000;
    const yearW = yr >= 2023 ? 100 : yr >= 2020 ? 90 : yr >= 2018 ? 80 : yr >= 2015 ? 60 : yr >= 2010 ? 40 : 20;
    // Pesos: Tipo(35%) Fonte(25%) PeerReview(20%) Citações(15%) Recência(5%)
    return sum + ts * 0.35 + ss * 0.25 + peerBonus * 0.20 + citW * 0.15 + yearW * 0.05;
  }, 0) / top.length;
  // Bônus de diversidade: mais bases consultadas = evidência mais ampla (max +15)
  const uniqueSources = new Set(top.map(a => a.source)).size;
  const diversityBonus = Math.min(15, (uniqueSources - 1) * 4);
  return Math.min(95, Math.max(30, Math.round(baseScore + diversityBonus)));
}

function icmLabel(score: number): string {
  if (score >= 85) return "muito alta";
  if (score >= 70) return "alta";
  if (score >= 55) return "média";
  return "limitada";
}

function classifyVenue(a: ArticleInput): "journal" | "conference" | "preprint" | "other" {
  if (a.source === "arXiv" || a.journal?.toLowerCase().includes("arxiv")) return "preprint";
  if (a.journal?.toLowerCase().includes("conference") || a.journal?.toLowerCase().includes("proceedings")) return "conference";
  if (a.source === "BASE" && !a.journal) return "other";
  return "journal";
}

function buildUserPrompt(query: string, articles: ArticleInput[], computedICM: number): string {
  const top8 = articles.slice(0, 12); // variável mantida por compatibilidade com o prompt

  const articlesList = top8
    .map((a, i) => {
      const venueType = classifyVenue(a);
      const venueTag =
        venueType === "journal" ? "Periódico" :
        venueType === "conference" ? "Conferência" :
        venueType === "preprint" ? "Preprint" : "Outro";
      const venue = a.journal ? ` | ${a.journal}` : "";
      const rawAbstract = a.abstract_pt?.trim() ?? "";
      const hasRealAbstract = rawAbstract.length >= 60 && rawAbstract !== "Abstract não disponível.";
      const abstract = hasRealAbstract ? rawAbstract.slice(0, 400) : "[SEM ABSTRACT — não inferir achados a partir do título]";
      const tldrLine = a.tldr ? `\nTL;DR (S2): ${a.tldr}` : "";
      return `[${i + 1}] chave:"${i + 1}" | ${a.title} (${a.authors}, ${a.year}) — ${a.study_type}, ${a.citations} cit., ${a.source}${venue} [${venueTag}]\nAbstract: ${abstract}${tldrLine}`;
    })
    .join("\n\n");

  const isQuestion = query.includes("?");

  return `Query de pesquisa: "${query}"

ICM pré-calculado dos artigos: ${computedICM}/100 (baseado em tipo de estudo e fonte). Use este valor como confidence_score no JSON — não calcule novamente.

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
      "title_pt": "Título traduzido fielmente para PT-BR. Se já estiver em português, repita igual.",
      "resumo_tecnico": "Tipo de estudo, N amostral, metodologia, resultados estatísticos (p-valor, HR se disponível), conclusão. Terminologia acadêmica. 2-4 frases. SE o abstract indicar [SEM ABSTRACT], escreva: 'Abstract completo não disponível para este artigo.'",
      "resumo_popular": "Linguagem simples. O que investigou, o que descobriu, por que importa. 2-3 frases. OBRIGATÓRIO: baseie-se APENAS no abstract fornecido. SE o abstract indicar [SEM ABSTRACT], escreva: 'O abstract completo deste artigo não está disponível. Não é possível descrever os achados sem acesso ao conteúdo original.'",
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

CRÍTICO: article_summaries deve ter uma entrada para CADA um dos ${top8.length} artigos listados, usando a "chave" exata. inline_synthesis mínimo 6 frases com citações [N].`;
}

// ─── Groq (principal — 14.400 req/dia grátis, muito rápido) ──────────────────
async function callGroq(prompt: string): Promise<string> {
  let lastError = "";
  for (const model of GROQ_MODELS) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.25,
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (res.status === 429 || res.status === 503) {
      lastError = String(res.status);
      await res.text();
      console.warn(`[api/summarize] Groq ${model} indisponível (${res.status})`);
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq ${res.status} (${model}): ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log(`[api/summarize] Groq sucesso: ${model}`);
      return content;
    }
  }
  throw new Error(`Groq falhou: ${lastError}`);
}

// ─── Google AI Studio (fallback 1) ───────────────────────────────────────────
async function callGoogleAI(prompt: string): Promise<string> {
  const res = await fetch(GOOGLE_AI_URL(GOOGLE_MODEL, GOOGLE_AI_KEY!), {
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

// ─── OpenRouter (fallback 2) ──────────────────────────────────────────────────
async function callOpenRouter(prompt: string): Promise<string> {
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

    if (res.status === 429 || res.status === 400 || res.status === 404) {
      const errText = await res.text();
      console.warn(`[api/summarize] OpenRouter ${model} indisponível (${res.status})`);
      lastError = `${res.status}`;
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter ${res.status} (${model}): ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log(`[api/summarize] OpenRouter sucesso: ${model}`);
      return content;
    }
  }

  throw new Error(`OpenRouter falhou em todos os modelos (último erro: ${lastError})`);
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { query, articles: allArticles } = req.body as { query: string; articles: ArticleInput[] };
  if (!query || !allArticles?.length)
    return res.status(400).json({ error: "query e articles são obrigatórios" });

  if (!GROQ_API_KEY && !GOOGLE_AI_KEY && !OPENROUTER_API_KEY)
    return res.status(500).json({ error: "Nenhuma chave de API configurada (GROQ_API_KEY, GOOGLE_AI_KEY ou OPENROUTER_API_KEY)" });

  // Limita aos top-20 para não explodir o contexto do modelo
  const articles = allArticles.slice(0, 20);

  try {
    const computedICM = computeICM(articles);
    const prompt = buildUserPrompt(query, articles, computedICM);

    // Cadeia de prioridade: Groq → Google AI → OpenRouter
    let raw: string;
    if (GROQ_API_KEY) {
      console.log("[api/summarize] tentando Groq");
      try {
        raw = await callGroq(prompt);
      } catch (groqErr) {
        console.warn("[api/summarize] Groq falhou, tentando fallback:", groqErr);
        if (GOOGLE_AI_KEY) {
          console.log("[api/summarize] tentando Google AI");
          raw = await callGoogleAI(prompt);
        } else if (OPENROUTER_API_KEY) {
          console.log("[api/summarize] tentando OpenRouter");
          raw = await callOpenRouter(prompt);
        } else {
          throw groqErr;
        }
      }
    } else if (GOOGLE_AI_KEY) {
      console.log("[api/summarize] tentando Google AI");
      try {
        raw = await callGoogleAI(prompt);
      } catch (googleErr) {
        console.warn("[api/summarize] Google AI falhou, tentando OpenRouter:", googleErr);
        if (OPENROUTER_API_KEY) {
          raw = await callOpenRouter(prompt);
        } else {
          throw googleErr;
        }
      }
    } else {
      console.log("[api/summarize] tentando OpenRouter");
      raw = await callOpenRouter(prompt);
    }

    // Remove qualquer bloco markdown (```json ... ``` ou ``` ... ```)
    const cleaned = raw.replace(/^```[\w]*\n?/m, "").replace(/\n?```\s*$/m, "").trim();
    // Extrai só o JSON caso haja texto antes/depois
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    const jsonStr = jsonStart !== -1 && jsonEnd !== -1 ? cleaned.slice(jsonStart, jsonEnd + 1) : cleaned;
    const synthesis = JSON.parse(jsonStr);

    // Sobrescreve confidence_score com o valor programático (mais confiável que a IA)
    synthesis.confidence_score = computedICM;
    synthesis.confidence_level = icmLabel(computedICM);

    return res.status(200).json({ synthesis });
  } catch (err) {
    console.error("[api/summarize]", err);
    return res.status(500).json({ error: "Falha ao gerar síntese", details: String(err) });
  }
}

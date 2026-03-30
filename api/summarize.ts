import type { VercelRequest, VercelResponse } from "@vercel/node";

// Aumenta timeout da função Vercel de 10s → 60s (necessário para síntese com LLM)
export const config = { maxDuration: 60 };

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
  doi?: string;
  journal?: string;
}

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
  const top12 = articles.slice(0, 8);

  const articlesList = top12
    .map((a, i) => {
      const venueType = classifyVenue(a);
      const venueTag =
        venueType === "journal" ? "📰 Periódico" :
        venueType === "conference" ? "🎓 Conferência" :
        venueType === "preprint" ? "⚡ Preprint" : "📄 Outro";
      const venue = a.journal ? ` | venue: ${a.journal}` : "";
      const doiKey = a.doi && a.doi !== "n/a" ? a.doi : `n/a-${i + 1}`;
      return `[${i + 1}] chave:"${doiKey}" | ${a.title} (${a.authors}, ${a.year}) — ${a.study_type}, ${a.citations} cit., fonte: ${a.source}${venue} [${venueTag}]\nAbstract: ${a.abstract_pt?.slice(0, 400) ?? "N/A"}`;
    })
    .join("\n\n");

  const isQuestion = query.includes("?");

  return `Query de pesquisa: "${query}"

Artigos (priorize 📰 Periódicos e 🎓 Conferências na síntese; sinalize ⚡ Preprints com menor peso):
${articlesList}

${
  isQuestion
    ? `Como esta é uma pergunta, calcule as porcentagens de consenso:
- consensus_agree: % que respondem SIM / confirmam (0-100)
- consensus_inconclusive: % inconclusivos (0-100)
- consensus_contradict: % que contradizem (0-100)
Os três devem somar exatamente 100.`
    : `Busca temática (não uma pergunta):
- consensus_agree: 0
- consensus_inconclusive: 100
- consensus_contradict: 0`
}

Retorne APENAS este JSON (sem markdown):
{
  "direct_answer": "Síntese direta em PT-BR (2-3 frases). Comece com 'Com base em X estudos analisados —'",
  "inline_synthesis": "Parágrafo único de síntese científica (5-8 frases). Sintetize o que há de COMUM entre os estudos. Quando houver divergência, aponte EXPLICITAMENTE: 'Embora [N] aponte X, [M] sugere Y'. Cada afirmação deve ter citação numérica [N]. Texto 100% em PT-BR fluído e científico. Priorize periódicos peer-reviewed.",
  "article_summaries": {
    "CHAVE_DO_ARTIGO_1": {
      "resumo_tecnico": "Resumo técnico para pesquisadores: tipo de estudo, N amostral, metodologia principal, resultados estatísticos (p-valor, HR, OR, IC95% se disponível), conclusão principal. Use terminologia acadêmica precisa. 2-4 frases.",
      "resumo_popular": "Resumo para leigos: explique o que o estudo investigou e o que descobriu em linguagem simples. Use analogias se necessário. Responda 'por que isso importa no dia a dia?'. 2-3 frases.",
      "evidence_level_badge": "Uma das opções: Meta-análise | Revisão Sistemática | Ensaio Clínico Randomizado | Estudo de Coorte | Estudo Transversal | Estudo Caso-Controle | Relato de Caso | Preprint não revisado | Revisão Narrativa | Estudo Observacional"
    }
  },
  "cited_sources": [
    {
      "index": 1,
      "title": "título exato do artigo [1]",
      "doi": "doi ou n/a",
      "citations": 0,
      "venue_type": "journal",
      "evidence_level": "frase curta: ex. Meta-análise Cochrane · Lancet 2023",
      "year": "ano",
      "authors": "Sobrenome et al."
    }
  ],
  "consensus_agree": 0,
  "consensus_inconclusive": 100,
  "consensus_contradict": 0,
  "confidence_level": "alta",
  "confidence_score": 75,
  "confidence_reasons": [
    "razão 1 sobre QUALIDADE METODOLÓGICA (design, peer-review, impacto)",
    "razão 2",
    "razão 3"
  ],
  "inconclusive_summary": "O que ainda está em debate ou sem conclusão definitiva",
  "contradict_explanation": "O que os estudos contrários argumentam (string vazia se consensus_contradict=0)",
  "practical_insight": "Aplicação prática para pesquisa acadêmica — o que um pesquisador deve considerar",
  "search_tip": "Sugestão de termos MeSH ou operadores booleanos para refinar a busca",
  "maturity_label": "Consenso consolidado",
  "study_recortes": [
    "Estudo [autor, ano]: [achado específico com n, p-valor ou efeito]"
  ],
  "resumos_pt": {
    "CHAVE_DO_ARTIGO_1": "Resumo em 1-2 frases em português (mantido por compatibilidade)."
  }
}

INSTRUÇÕES CRÍTICAS:
- inline_synthesis: OBRIGATÓRIO. Mínimo 5 frases. Cite [N] após cada afirmação. Aponte divergências quando existirem.
- article_summaries: para TODOS os artigos listados. Use a "chave" exata de cada artigo (doi ou "n/a-N"). resumo_tecnico em linguagem acadêmica precisa. resumo_popular acessível, sem jargão.
- cited_sources: apenas artigos citados em inline_synthesis (máx 8).
- confidence_reasons: fale sobre QUALIDADE da evidência (design, revisão por pares, tamanho amostral). NUNCA copie achados factuais dos estudos.
- study_recortes: 3-5 recortes concretos com dados numéricos dos abstracts.
- resumos_pt: compatibilidade — use mesma chave de article_summaries.`;
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
        temperature: 0.25,
        max_tokens: 4000,
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

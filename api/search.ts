import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAILTO = "contact@scholaria.app";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ─── Query expansion: PT → structured { pt[], en[], short } via Groq ─────────

interface QueryExpansion {
  pt: string[];    // 3 variações em português
  en: string[];    // 3 variações em inglês com termos MeSH quando aplicável
  short: string;   // query curta em inglês (2-4 termos)
}

function parseExpansionJson(raw: string): QueryExpansion | null {
  // 1. Tenta direto
  try {
    const parsed = JSON.parse(raw);
    if (isValidExpansion(parsed)) return parsed;
  } catch {}
  // 2. Remove ```json ... ``` ou ``` ... ```
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(stripped);
    if (isValidExpansion(parsed)) return parsed;
  } catch {}
  // 3. Extrai o primeiro objeto JSON da string
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (isValidExpansion(parsed)) return parsed;
    } catch {}
  }
  return null;
}

function isValidExpansion(obj: unknown): obj is QueryExpansion {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    Array.isArray(o.pt) && o.pt.length >= 1 &&
    Array.isArray(o.en) && o.en.length >= 1 &&
    typeof o.short === "string" && o.short.length > 0
  );
}

function fallbackExpansion(query: string): QueryExpansion {
  return { pt: [query], en: [query], short: query };
}

async function expandQuery(query: string): Promise<QueryExpansion> {
  if (!GROQ_API_KEY) return fallbackExpansion(query);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You are a biomedical search expert. Given an academic query (possibly in Portuguese), return a JSON object with exactly these fields:\n- "pt": array of 3 Portuguese alternative formulations (synonyms, related terms, different phrasings)\n- "en": array of 3 English formulations using MeSH terms when applicable\n- "short": one short English query with 2-4 key terms (max 6 words)\n\nReturn ONLY valid JSON, no explanation, no markdown.',
          },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return fallbackExpansion(query);
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = parseExpansionJson(raw);
    if (parsed) {
      console.log(`[api/search] expansão: pt=[${parsed.pt[0]}] en=[${parsed.en[0]}] short="${parsed.short}"`);
      return parsed;
    }
  } catch (e) {
    console.warn("[api/search] expansão de query falhou, usando fallback:", e);
  }
  return fallbackExpansion(query);
}

// ─── DOI cleanup ─────────────────────────────────────────────────────────────

/**
 * Normaliza um DOI bruto para o formato limpo "10.xxxx/yyyy".
 * Remove prefixos de URL, sufixos "[doi]" e outros artefatos de APIs.
 * Retorna string vazia se o resultado não parecer um DOI válido.
 */
function cleanDoi(raw: string | null | undefined): string {
  if (!raw) return "";
  let d = raw.trim();
  // Remove prefixos de URL (https://doi.org/, http://dx.doi.org/, etc.)
  d = d.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  // Remove prefixo textual "doi: " ou "DOI:" (case-insensitive)
  d = d.replace(/^doi:\s*/i, "");
  // PubMed elocationid: "10.1000/xyz [doi]" ou "S123 [pii] 10.1000/xyz [doi]"
  // Extrai o DOI marcado com [doi] se existir
  const doiTagMatch = d.match(/(\S+)\s*\[doi\]/i);
  if (doiTagMatch) {
    d = doiTagMatch[1];
  }
  d = d.trim();
  // Valida: DOI real começa com "10." seguido de 4+ dígitos e uma barra
  if (!/^10\.\d{4,}\/\S+/.test(d)) return "";
  return d;
}

// ─── Shared article shape ─────────────────────────────────────────────────────

interface Article {
  title: string;
  authors: string;
  year: string;
  journal: string;
  source: string;
  citations: number;
  is_oa: boolean;
  doi: string;
  evidence_score: number;
  study_type: string;
  expert_reviewed: boolean;
  source_quality: string;
  potential_bias: string;
  abstract_pt: string;
  evidence_reason: string;
  abnt: string;
  confidence_score: number;
  confidence_factors: object;
  url?: string;
  language?: "pt" | "en" | "es";
  /** true quando o abstract foi estimado por IA (S2 fallback ou geração Groq) */
  abstract_generated?: boolean;
  /** TL;DR do Semantic Scholar — resumo de 1-2 frases baseado no paper real */
  tldr?: string;
  /** true quando o tipo de estudo foi inferido do tipo de publicação, não do design real */
  study_type_inferred?: boolean;
  /** Score de relevância semântica 0-100 em relação à query do usuário */
  relevance_score?: number;
  /** true quando o artigo tem baixo overlap com os termos da busca */
  low_relevance?: boolean;
}

/** Returns { type, inferred: true } when the design is unknown and was guessed from publication type */
function studyTypeFromLabel(label: string): { type: string; inferred: boolean } {
  const t = label.toLowerCase();
  if (t.includes("meta-analys") || t.includes("meta analys") || t.includes("metaanalys")) return { type: "meta-análise", inferred: false };
  if ((t.includes("systematic") && t.includes("review")) || t.includes("cochrane")) return { type: "revisão sistemática", inferred: false };
  if (t.includes("systematic")) return { type: "revisão sistemática", inferred: false };
  if (t.includes("narrative review") || t.includes("literature review") || t.includes("scoping review")) return { type: "revisão narrativa", inferred: false };
  if (t.includes("review")) return { type: "revisão sistemática", inferred: false };
  if (t.includes("randomized") || t.includes("randomised") || t.includes(" rct") || t.includes("controlled trial")) return { type: "ensaio clínico randomizado", inferred: false };
  if (t.includes("trial") || t.includes("clinical trial")) return { type: "ensaio clínico randomizado", inferred: false };
  if (t.includes("cohort") || t.includes("coorte") || t.includes("longitudinal") || t.includes("prospective")) return { type: "coorte", inferred: false };
  if (t.includes("case-control") || t.includes("case control")) return { type: "estudo observacional", inferred: false };
  if (t.includes("case report") || t.includes("case series") || t.includes("case study")) return { type: "relato de caso", inferred: false };
  if (t.includes("cross-section") || t.includes("cross section") || t.includes("survey") || t.includes("transversal")) return { type: "estudo transversal", inferred: false };
  if (t.includes("preprint") || t.includes("posted-content")) return { type: "preprint", inferred: false };
  // Tipo de publicação genérico — design metodológico desconhecido
  if (t.includes("journalarticle") || t.includes("journal article") || t.includes("journal-article")) return { type: "estudo observacional", inferred: true };
  return { type: "estudo observacional", inferred: true };
}

/** Returns spreadable props for buildArticle: { studyType, studyTypeInferred } */
function studyTypeProps(label: string): { studyType: string; studyTypeInferred: boolean } {
  const { type, inferred } = studyTypeFromLabel(label);
  return { studyType: type, studyTypeInferred: inferred };
}

function evScoreFromStudyType(studyType: string): number {
  if (studyType === "meta-análise" || studyType === "revisão sistemática") return 5;
  if (studyType === "ensaio clínico randomizado") return 4;
  if (studyType === "preprint") return 2;
  return 3;
}

/**
 * Gera uma frase de relevância conectando o artigo à busca do usuário.
 * Programático — sem chamada de LLM.
 */
function buildEvidenceReason(article: Article, query: string): string {
  const abstract = article.abstract_pt?.trim() ?? "";

  // Sem abstract real → não gera texto especulativo
  if (abstract.length < 50 || abstract === "Abstract não disponível.") {
    return "";
  }

  const queryLower = query.toLowerCase().replace(/[?!.]+$/, "").trim();

  // Extrai a primeira frase substantiva do abstract (>40 chars)
  const sentences = abstract.split(/(?<=[.!?])\s+/);
  const firstSentence = sentences.find((s) => s.length > 40);
  const abstractSnippet = firstSentence ? firstSentence.replace(/\s+/g, " ").trim() : "";

  const studyLabel =
    article.study_type === "meta-análise" ? "Esta meta-análise" :
    article.study_type === "revisão sistemática" ? "Esta revisão sistemática" :
    article.study_type === "ensaio clínico randomizado" ? "Este ensaio clínico randomizado" :
    article.study_type === "coorte" ? "Este estudo de coorte" :
    article.study_type === "preprint" ? "Este preprint" :
    "Este estudo";

  const citNote = article.citations >= 50
    ? ` (${article.citations.toLocaleString()} citações)`
    : article.citations > 0
    ? ` (${article.citations} cit.)`
    : "";

  const connector = abstractSnippet
    ? `${studyLabel}${citNote} aborda o tema "${queryLower}". ${abstractSnippet}`
    : `${studyLabel}${citNote} é relevante para a busca sobre "${queryLower}".`;

  return connector.length > 280 ? connector.slice(0, 280) + "…" : connector;
}

function buildArticle(p: {
  title: string;
  authors: string;
  year: number | null;
  journal: string;
  source: string;
  citations: number;
  is_oa: boolean;
  doi: string;
  abstract: string;
  studyType: string;
  studyTypeInferred?: boolean;
  url?: string;
  language?: "pt" | "en" | "es";
}): Article {
  const evScore = evScoreFromStudyType(p.studyType);
  const firstAuthor = (p.authors || "AUTOR").split(",")[0].toUpperCase();
  return {
    title: p.title,
    authors: p.authors || "Autores não disponíveis",
    year: String(p.year ?? ""),
    journal: p.journal || "Periódico não informado",
    source: p.source,
    citations: p.citations,
    is_oa: p.is_oa,
    doi: p.doi,
    evidence_score: evScore,
    study_type: p.studyType,
    expert_reviewed: evScore >= 4,
    source_quality: evScore >= 4 ? "alta" : evScore >= 3 ? "média" : "baixa",
    potential_bias: "Verificar metodologia no artigo original",
    abstract_pt: p.abstract?.trim() || "",
    evidence_reason: `${p.studyType} com ${p.citations} citações.`,
    abnt: `${firstAuthor}. ${p.title}. ${p.journal || "s.n."}, ${p.year ?? "s.d."}.`,
    confidence_score: (() => {
      // evScore: 5=meta/rev.sist, 4=RCT, 3=coorte/observacional, 2=preprint, 1=fallback
      const studyW = evScore === 5 ? 100 : evScore === 4 ? 75 : evScore === 3 ? 65 : evScore === 2 ? 35 : 45;
      const sourceW =
        p.source === "Cochrane" ? 95 : p.source === "PubMed" ? 90 :
        p.source === "Semantic Scholar" ? 88 : p.source === "Europe PMC" ? 82 :
        p.source === "OpenAlex" ? 78 : p.source === "DOAJ" ? 75 :
        p.source === "SciELO" ? 75 : p.source === "BVS/LILACS" ? 72 :
        p.source === "CrossRef" ? 70 : p.source === "CORE" ? 65 :
        p.source === "Lens.org" ? 65 : p.source === "BASE" ? 60 :
        p.source === "arXiv" ? 58 : 70;
      const peerW = evScore === 5 ? 100 : evScore === 4 ? 90 : evScore === 3 ? 70 : 0;
      const recencyW = p.year && p.year >= 2022 ? 100 : p.year && p.year >= 2018 ? 80 : p.year && p.year >= 2013 ? 60 : p.year && p.year >= 2000 ? 40 : 20;
      const citW = Math.min(100, Math.floor(p.citations / 2));
      const noAbstractPenalty = (!p.abstract || p.abstract.trim().length < 50) ? 10 : 0;
      const noDoiPenalty = (!p.doi || p.doi === "n/a" || p.doi === "") ? 8 : 0;
      const agePenalty = p.year && p.year < 1990 ? 15 : p.year && p.year < 2000 ? 8 : 0;
      // Pesos: Study(30%) Source(25%) Peer(25%) Recency(15%) Cit(5%) − penalties
      return Math.min(95, Math.max(25, Math.round(
        studyW * 0.30 + sourceW * 0.25 + peerW * 0.25 + recencyW * 0.15 + citW * 0.05
        - noAbstractPenalty - noDoiPenalty - agePenalty
      )));
    })(),
    confidence_factors: {
      domain_weight:
        p.source === "Cochrane" ? 95 : p.source === "PubMed" ? 90 :
        p.source === "Semantic Scholar" ? 88 : p.source === "Europe PMC" ? 82 :
        p.source === "OpenAlex" ? 78 : p.source === "DOAJ" ? 75 :
        p.source === "SciELO" ? 75 : p.source === "BVS/LILACS" ? 72 :
        p.source === "CrossRef" ? 70 : p.source === "CORE" ? 65 :
        p.source === "Lens.org" ? 65 : p.source === "BASE" ? 60 :
        p.source === "arXiv" ? 58 : 70,
      peer_reviewed: evScore >= 3,
      study_type_weight: evScore === 5 ? 100 : evScore === 4 ? 75 : evScore === 3 ? 65 : evScore === 2 ? 35 : 45,
      recency_score:
        p.year && p.year >= 2022 ? 100 : p.year && p.year >= 2018 ? 80 : p.year && p.year >= 2013 ? 60 : p.year && p.year >= 2000 ? 40 : 20,
      citations_weight: Math.min(100, Math.floor(p.citations / 2)),
    },
    ...(p.url ? { url: p.url } : {}),
    ...(p.language ? { language: p.language } : {}),
    ...(p.studyTypeInferred ? { study_type_inferred: true } : {}),
  };
}

// ─── Relevance scoring ────────────────────────────────────────────────────────

function relevanceScore(article: Article, queryTerms: string[]): number {
  const title = article.title.toLowerCase();
  const abstract = article.abstract_pt.toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    if (title.includes(term)) score += 3;
    else if (abstract.includes(term)) score += 1;
  }
  return score;
}

// ─── OpenAlex (EN query, all languages) ──────────────────────────────────────

function reconstructAbstract(
  inv: Record<string, number[]> | null | undefined
): string {
  if (!inv) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.filter(Boolean).join(" ");
}

function truncateAuthors(authors: string): string {
  if (!authors) return "Autores não disponíveis";
  const parts = authors.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 3) return parts.join(", ");
  return parts.slice(0, 3).join(", ") + " et al.";
}

function oaSource(work: {
  primary_location?: { source?: { display_name?: string; is_in_doaj?: boolean } };
  doi?: string;
}): string {
  const src = (work.primary_location?.source?.display_name ?? "").toLowerCase();
  const doi = (work.doi ?? "").toLowerCase();
  if (src.includes("arxiv")) return "arXiv";
  if (src.includes("cochrane") || doi.includes("cochrane")) return "Cochrane";
  if (src.includes("pubmed") || src.includes("medline")) return "PubMed";
  if (src.includes("scielo")) return "SciELO";
  if (src.includes("lilacs") || src.includes("bireme")) return "BVS/LILACS";
  if (src.includes("europe pmc") || src.includes("europepmc")) return "Europe PMC";
  if (work.primary_location?.source?.is_in_doaj) return "DOAJ";
  return "OpenAlex";
}

const OA_FIELDS = [
  "id", "title", "authorships", "publication_year",
  "abstract_inverted_index", "cited_by_count",
  "open_access", "primary_location", "type", "doi",
].join(",");

function mapOpenAlexWork(w: any): Article {
  const authors = (w.authorships ?? [])
    .slice(0, 3)
    .map((a: any) => a.author?.display_name ?? "")
    .filter(Boolean)
    .join(", ");
  const doi = cleanDoi(w.doi);
  const oaUrl = w.open_access?.oa_url ?? (doi ? `https://doi.org/${doi}` : undefined);
  return buildArticle({
    title: w.title,
    authors,
    year: w.publication_year ?? null,
    journal: w.primary_location?.source?.display_name ?? "Periódico não informado",
    source: oaSource(w),
    citations: w.cited_by_count ?? 0,
    is_oa: w.open_access?.is_oa ?? false,
    doi,
    abstract: reconstructAbstract(w.abstract_inverted_index),
    ...studyTypeProps(w.type ?? ""),
    url: oaUrl,
  });
}

async function fetchOpenAlex(query: string): Promise<Article[]> {
  const url =
    `https://api.openalex.org/works` +
    `?search=${encodeURIComponent(query)}` +
    `&per-page=25&select=${OA_FIELDS}` +
    `&mailto=${MAILTO}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return (data.results ?? []).filter((w) => w.title).map(mapOpenAlexWork);
}

// ─── OpenAlex PT (original PT query + language:pt filter) ────────────────────

async function fetchOpenAlexPT(query: string): Promise<Article[]> {
  const url =
    `https://api.openalex.org/works` +
    `?search=${encodeURIComponent(query)}` +
    `&filter=language:pt` +
    `&per-page=20&select=${OA_FIELDS}` +
    `&mailto=${MAILTO}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`OpenAlexPT ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return (data.results ?? []).filter((w) => w.title).map((w) => {
    const a = mapOpenAlexWork(w);
    a.language = "pt";
    return a;
  });
}

// ─── CrossRef ─────────────────────────────────────────────────────────────────

async function fetchCrossRef(query: string): Promise<Article[]> {
  const url =
    `https://api.crossref.org/works` +
    `?query=${encodeURIComponent(query)}` +
    `&rows=15&mailto=${MAILTO}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`CrossRef ${res.status}`);
  const data = (await res.json()) as { message: { items: any[] } };
  return (data.message?.items ?? [])
    .filter((item) => item.title?.length)
    .map((item) => {
      const title = Array.isArray(item.title) ? item.title[0] : item.title;
      const authors = (item.author ?? [])
        .slice(0, 3)
        .map((a: any) => `${a.given ?? ""} ${a.family ?? ""}`.trim())
        .filter(Boolean)
        .join(", ");
      const year =
        item.published?.["date-parts"]?.[0]?.[0] ??
        item["published-print"]?.["date-parts"]?.[0]?.[0] ??
        null;
      const journal = Array.isArray(item["container-title"])
        ? item["container-title"][0]
        : (item["container-title"] ?? "");
      const doi = cleanDoi(item.DOI);
      // CrossRef returns JATS XML in abstract field for some journals
      const rawAbstract = item.abstract ?? "";
      const abstract = rawAbstract.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return buildArticle({
        title,
        authors,
        year,
        journal: journal || "Periódico não informado",
        source: "CrossRef",
        citations: item["is-referenced-by-count"] ?? 0,
        is_oa: false,
        doi,
        abstract,
        ...studyTypeProps(item.type ?? ""),
        url: doi ? `https://doi.org/${doi}` : undefined,
      });
    });
}

// ─── Europe PMC (EN) ──────────────────────────────────────────────────────────

function epmcSource(src: string): string {
  if (src === "MED") return "PubMed";
  if (src === "PMC") return "Europe PMC";
  if (src === "PPR") return "arXiv";
  if (src === "AGR") return "BASE";
  if (src === "CBA") return "BVS/LILACS";
  return "Europe PMC";
}

async function fetchEuropePMC(query: string): Promise<Article[]> {
  const url =
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search` +
    `?query=${encodeURIComponent(query)}` +
    `&format=json&pageSize=15&resultType=core`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`EuropePMC ${res.status}`);
  const data = (await res.json()) as { resultList: { result: any[] } };
  return (data.resultList?.result ?? [])
    .filter((r) => r.title)
    .map((r) => {
      return buildArticle({
        title: r.title,
        authors: truncateAuthors(r.authorString ?? ""),
        year: r.pubYear ? parseInt(r.pubYear) : null,
        journal: r.journalTitle ?? "Periódico não informado",
        source: epmcSource(r.source ?? ""),
        citations: r.citedByCount ?? 0,
        is_oa: r.isOpenAccess === "Y",
        doi: cleanDoi(r.doi),
        abstract: r.abstractText ?? "",
        ...studyTypeProps(r.pubType ?? ""),
        url: r.doi ? `https://doi.org/${r.doi}` : undefined,
      });
    });
}

// ─── Europe PMC PT (original PT query + LANG:por/spa filter) ─────────────────

async function fetchEuropePMCPT(query: string): Promise<Article[]> {
  const ptQuery = `${query} AND (LANG:por OR LANG:spa)`;
  const url =
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search` +
    `?query=${encodeURIComponent(ptQuery)}` +
    `&format=json&pageSize=15&resultType=core`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`EuropePMCPT ${res.status}`);
  const data = (await res.json()) as { resultList: { result: any[] } };
  return (data.resultList?.result ?? [])
    .filter((r) => r.title)
    .map((r) => {
      return buildArticle({
        title: r.title,
        authors: truncateAuthors(r.authorString ?? ""),
        year: r.pubYear ? parseInt(r.pubYear) : null,
        journal: r.journalTitle ?? "Periódico não informado",
        source: epmcSource(r.source ?? ""),
        citations: r.citedByCount ?? 0,
        is_oa: r.isOpenAccess === "Y",
        doi: cleanDoi(r.doi),
        abstract: r.abstractText ?? "",
        ...studyTypeProps(r.pubType ?? ""),
        url: r.doi ? `https://doi.org/${r.doi}` : undefined,
        language: "pt",
      });
    });
}

// ─── PubMed (NCBI Entrez) — com abstracts via efetch XML ─────────────────────

function parseXmlAbstracts(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const articles = xml.split(/<PubmedArticle[\s>]/g).slice(1);
  for (const block of articles) {
    const pmidM = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    if (!pmidM) continue;
    const parts: string[] = [];
    const reg = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
    let m: RegExpExecArray | null;
    while ((m = reg.exec(block)) !== null) {
      parts.push(m[1].replace(/<[^>]+>/g, "").trim());
    }
    if (parts.length > 0) result[pmidM[1]] = parts.join(" ");
  }
  return result;
}

async function fetchPubMed(query: string): Promise<Article[]> {
  const ncbiKey = process.env.NCBI_API_KEY ?? "";
  const keyParam = ncbiKey ? `&api_key=${ncbiKey}` : "";

  const searchUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` +
    `?db=pubmed&term=${encodeURIComponent(query)}&retmax=15&retmode=json${keyParam}`;
  const searchRes = await fetch(searchUrl, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!searchRes.ok) throw new Error(`PubMed search ${searchRes.status}`);
  const searchData = (await searchRes.json()) as { esearchresult: { idlist: string[] } };
  const ids = searchData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const idStr = ids.join(",");
  const summaryUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` +
    `?db=pubmed&id=${idStr}&retmode=json${keyParam}`;
  const fetchUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi` +
    `?db=pubmed&id=${idStr}&retmode=xml${keyParam}`;

  const [summaryRes, fetchRes] = await Promise.all([
    fetch(summaryUrl, { headers: { "User-Agent": "ScholarIA/1.0" }, signal: AbortSignal.timeout(8000) }),
    fetch(fetchUrl,   { headers: { "User-Agent": "ScholarIA/1.0" }, signal: AbortSignal.timeout(8000) }),
  ]);

  if (!summaryRes.ok) throw new Error(`PubMed summary ${summaryRes.status}`);
  const summaryData = (await summaryRes.json()) as { result: Record<string, any> };
  const summaries = summaryData.result ?? {};

  const abstracts: Record<string, string> = {};
  if (fetchRes.ok) {
    try {
      const xml = await fetchRes.text();
      Object.assign(abstracts, parseXmlAbstracts(xml));
    } catch (_) { /* non-fatal */ }
  }

  return ids
    .map((id) => {
      const item = summaries[id];
      if (!item || !item.title) return null;
      const authors = (item.authors ?? [])
        .slice(0, 3)
        .map((a: any) => a.name ?? "")
        .filter(Boolean)
        .join(", ");
      const year = item.pubdate ? parseInt(item.pubdate.slice(0, 4)) : null;
      const doi = cleanDoi(item.elocationid);
      const pubTypes: string = (item.pubtype ?? []).join(" ").toLowerCase();
      return buildArticle({
        title: item.title,
        authors: authors || "Autores não disponíveis",
        year,
        journal: item.fulljournalname ?? item.source ?? "Periódico não informado",
        source: "PubMed",
        citations: 0,
        is_oa: false,
        doi,
        abstract: abstracts[id] ?? "",
        ...studyTypeProps(pubTypes || item.fulljournalname || ""),
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      });
    })
    .filter((a): a is Article => a !== null);
}

// ─── PubMed PT (Portuguese[Language] filter) ─────────────────────────────────

async function fetchPubMedPT(query: string): Promise<Article[]> {
  const ncbiKey = process.env.NCBI_API_KEY ?? "";
  const keyParam = ncbiKey ? `&api_key=${ncbiKey}` : "";
  const ptQuery = `${query} AND Portuguese[Language]`;

  const searchUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` +
    `?db=pubmed&term=${encodeURIComponent(ptQuery)}&retmax=10&retmode=json${keyParam}`;
  const searchRes = await fetch(searchUrl, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!searchRes.ok) throw new Error(`PubMedPT search ${searchRes.status}`);
  const searchData = (await searchRes.json()) as { esearchresult: { idlist: string[] } };
  const ids = searchData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const idStr = ids.join(",");
  const summaryUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` +
    `?db=pubmed&id=${idStr}&retmode=json${keyParam}`;
  const fetchUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi` +
    `?db=pubmed&id=${idStr}&retmode=xml${keyParam}`;

  const [summaryRes, fetchRes] = await Promise.all([
    fetch(summaryUrl, { headers: { "User-Agent": "ScholarIA/1.0" }, signal: AbortSignal.timeout(8000) }),
    fetch(fetchUrl,   { headers: { "User-Agent": "ScholarIA/1.0" }, signal: AbortSignal.timeout(8000) }),
  ]);

  if (!summaryRes.ok) throw new Error(`PubMedPT summary ${summaryRes.status}`);
  const summaryData = (await summaryRes.json()) as { result: Record<string, any> };
  const summaries = summaryData.result ?? {};

  const abstracts: Record<string, string> = {};
  if (fetchRes.ok) {
    try {
      const xml = await fetchRes.text();
      Object.assign(abstracts, parseXmlAbstracts(xml));
    } catch (_) { /* non-fatal */ }
  }

  return ids
    .map((id) => {
      const item = summaries[id];
      if (!item || !item.title) return null;
      const authors = (item.authors ?? [])
        .slice(0, 3)
        .map((a: any) => a.name ?? "")
        .filter(Boolean)
        .join(", ");
      const year = item.pubdate ? parseInt(item.pubdate.slice(0, 4)) : null;
      const doi = cleanDoi(item.elocationid);
      const pubTypes: string = (item.pubtype ?? []).join(" ").toLowerCase();
      return buildArticle({
        title: item.title,
        authors: authors || "Autores não disponíveis",
        year,
        journal: item.fulljournalname ?? item.source ?? "Periódico não informado",
        source: "PubMed",
        citations: 0,
        is_oa: false,
        doi,
        abstract: abstracts[id] ?? "",
        ...studyTypeProps(pubTypes || item.fulljournalname || ""),
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        language: "pt",
      });
    })
    .filter((a): a is Article => a !== null);
}

// ─── DOAJ ─────────────────────────────────────────────────────────────────────

async function fetchDOAJ(query: string): Promise<Article[]> {
  const url =
    `https://doaj.org/api/search/articles/${encodeURIComponent(query)}` +
    `?pageSize=12&page=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`DOAJ ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return (data.results ?? [])
    .filter((r) => r.bibjson?.title)
    .map((r) => {
      const bib = r.bibjson ?? {};
      const title = Array.isArray(bib.title) ? bib.title[0] : bib.title;
      const authors = (bib.author ?? [])
        .slice(0, 3)
        .map((a: any) => `${a.name ?? ""}`.trim())
        .filter(Boolean)
        .join(", ");
      const year = bib.year ? parseInt(bib.year) : null;
      const journal = bib.journal?.title ?? "DOAJ";
      const doi = cleanDoi((bib.identifier ?? []).find((i: any) => i.type === "doi")?.id);
      return buildArticle({
        title,
        authors: authors || "Autores não disponíveis",
        year,
        journal,
        source: "DOAJ",
        citations: 0,
        is_oa: true,
        doi,
        abstract: bib.abstract ?? "",
        studyType: "estudo observacional",
        url: doi ? `https://doi.org/${doi}` : undefined,
      });
    });
}

// ─── Semantic Scholar ─────────────────────────────────────────────────────────

async function fetchSemanticScholar(query: string): Promise<Article[]> {
  const apiKey = process.env.S2_API_KEY;
  const headers: Record<string, string> = { "User-Agent": "ScholarIA/1.0" };
  if (apiKey) headers["x-api-key"] = apiKey;

  const fields = "title,authors,year,abstract,citationCount,isOpenAccess,externalIds,publicationTypes";
  const url =
    `https://api.semanticscholar.org/graph/v1/paper/search` +
    `?query=${encodeURIComponent(query)}&limit=12&fields=${fields}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`SemanticScholar ${res.status}`);
  const data = (await res.json()) as { data: any[] };
  return (data.data ?? [])
    .filter((p) => p.title)
    .map((p) => {
      const doi = cleanDoi(p.externalIds?.DOI);
      const authors = truncateAuthors(
        (p.authors ?? []).map((a: any) => a.name).filter(Boolean).join(", ")
      );
      const types = (p.publicationTypes ?? []).join(" ").toLowerCase();
      return buildArticle({
        title: p.title,
        authors,
        year: p.year ?? null,
        journal: p.externalIds?.PubMed ? "PubMed (via S2)" : "Semantic Scholar",
        source: "Semantic Scholar",
        citations: p.citationCount ?? 0,
        is_oa: p.isOpenAccess ?? false,
        doi,
        abstract: p.abstract ?? "",
        ...studyTypeProps(types),
        url: doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${p.paperId}`,
      });
    });
}

// ─── Psychology detection ─────────────────────────────────────────────────────

const PSYCH_TERMS = /\b(psicolog|psiquiatr|psicoterapia|terapia cognitiv|terapia comportament|saúde mental|transtorno|depressão|ansiedade|bipolar|esquizofrenia|tdah|autismo|burnout|trauma|ptsd|estresse|cogniç|emoç|comportamento|neurodesenvolvimento|psicoanális|freud|jung|psicanál|personalidade|aprendizagem|memoria|cognitiv|neurocognitiv|psicopatolog|intervention psycholog|mental health|anxiety disorder|depression disorder|cognitive behavior|psychotherapy|psychiatry|psychology|psychological|neuropsycholog|developmental disorder|autism spectrum|attention deficit)\b/i;

function isPsychQuery(q: string): boolean {
  return PSYCH_TERMS.test(q);
}

// ─── Semantic Scholar — Psychology field filter ───────────────────────────────

async function fetchSemanticScholarPsych(query: string): Promise<Article[]> {
  const apiKey = process.env.S2_API_KEY;
  const headers: Record<string, string> = { "User-Agent": "ScholarIA/1.0" };
  if (apiKey) headers["x-api-key"] = apiKey;

  const fields = "title,authors,year,abstract,citationCount,isOpenAccess,externalIds,publicationTypes";
  const url =
    `https://api.semanticscholar.org/graph/v1/paper/search` +
    `?query=${encodeURIComponent(query)}&limit=12&fields=${fields}` +
    `&fieldsOfStudy=Psychology`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`SemanticScholarPsych ${res.status}`);
  const data = (await res.json()) as { data: any[] };
  return (data.data ?? [])
    .filter((p) => p.title)
    .map((p) => {
      const doi = cleanDoi(p.externalIds?.DOI);
      const authors = truncateAuthors(
        (p.authors ?? []).map((a: any) => a.name).filter(Boolean).join(", ")
      );
      const types = (p.publicationTypes ?? []).join(" ").toLowerCase();
      return buildArticle({
        title: p.title,
        authors,
        year: p.year ?? null,
        journal: "Semantic Scholar",
        source: "Semantic Scholar",
        citations: p.citationCount ?? 0,
        is_oa: p.isOpenAccess ?? false,
        doi,
        abstract: p.abstract ?? "",
        ...studyTypeProps(types),
        url: doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${p.paperId}`,
      });
    });
}

// ─── OpenAlex — Psychology concept (C15744967) ────────────────────────────────

async function fetchOpenAlexPsych(query: string): Promise<Article[]> {
  // C15744967 = Psychology concept in OpenAlex
  const url =
    `https://api.openalex.org/works` +
    `?search=${encodeURIComponent(query)}` +
    `&filter=concepts.id:C15744967` +
    `&per-page=15&select=${OA_FIELDS}` +
    `&mailto=${MAILTO}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`OpenAlexPsych ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return (data.results ?? []).filter((w) => w.title).map(mapOpenAlexWork);
}

// ─── PsyArXiv (OSF preprints — psychology) ───────────────────────────────────

async function fetchPsyArXiv(query: string): Promise<Article[]> {
  const url =
    `https://api.osf.io/v2/preprints/` +
    `?filter[provider]=psyarxiv` +
    `&filter[title]=${encodeURIComponent(query)}` +
    `&page[size]=8`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`PsyArXiv ${res.status}`);
  const data = (await res.json()) as { data: any[] };
  return (data.data ?? [])
    .filter((p) => p.attributes?.title)
    .map((p) => {
      const attr = p.attributes ?? {};
      const doi = cleanDoi(attr.doi);
      const year = attr.date_published
        ? parseInt(attr.date_published.slice(0, 4))
        : null;
      return buildArticle({
        title: attr.title,
        authors: "Autores não disponíveis",
        year,
        journal: "PsyArXiv",
        source: "arXiv",
        citations: 0,
        is_oa: true,
        doi,
        abstract: attr.description ?? "",
        studyType: "preprint",
        url: doi ? `https://doi.org/${doi}` : `https://psyarxiv.com/${p.id}/`,
      });
    });
}

// ─── Abstract enrichment (S2 batch → Groq fallback) ──────────────────────────

/** Busca abstracts + TLDR em lote no Semantic Scholar via DOI (1 request para N artigos). */
async function fetchS2AbstractsBatch(
  dois: string[]
): Promise<Record<string, { abstract?: string; tldr?: string }>> {
  if (dois.length === 0) return {};
  const apiKey = process.env.S2_API_KEY;
  const headers: Record<string, string> = {
    "User-Agent": "ScholarIA/1.0",
    "Content-Type": "application/json",
  };
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const ids = dois.map((d) => `DOI:${d}`);
    const res = await fetch(
      "https://api.semanticscholar.org/graph/v1/paper/batch?fields=abstract,tldr,externalIds",
      { method: "POST", headers, body: JSON.stringify({ ids }), signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return {};
    const data = (await res.json()) as Array<{
      abstract?: string;
      tldr?: { text: string };
      externalIds?: { DOI?: string };
    } | null>;
    const result: Record<string, { abstract?: string; tldr?: string }> = {};
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      if (entry) {
        result[dois[i]] = {
          abstract: entry.abstract || undefined,
          tldr: entry.tldr?.text || undefined,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

/** Busca citation counts em lote no S2 para artigos com DOI (ex: PubMed que retorna 0). */
async function enrichCitationsFromS2(articles: Article[]): Promise<void> {
  const zeroCited = articles.filter((a) => a.citations === 0 && a.doi);
  if (zeroCited.length === 0) return;
  const apiKey = process.env.S2_API_KEY;
  const headers: Record<string, string> = {
    "User-Agent": "ScholarIA/1.0",
    "Content-Type": "application/json",
  };
  if (apiKey) headers["x-api-key"] = apiKey;
  try {
    const ids = zeroCited.map((a) => `DOI:${a.doi}`);
    const res = await fetch(
      "https://api.semanticscholar.org/graph/v1/paper/batch?fields=citationCount,externalIds",
      { method: "POST", headers, body: JSON.stringify({ ids }), signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return;
    const data = (await res.json()) as Array<{ citationCount?: number } | null>;
    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      if (entry?.citationCount && entry.citationCount > 0) {
        zeroCited[i].citations = entry.citationCount;
        // Atualiza também o confidence_score com a nova informação de citações
        const citW = Math.min(100, Math.floor(entry.citationCount / 10));
        const prev = zeroCited[i].confidence_score;
        // Adiciona até 5 pontos (peso de citações = 5%)
        zeroCited[i].confidence_score = Math.min(95, Math.round(prev + citW * 0.05));
      }
    }
  } catch { /* non-fatal */ }
}

/** Gera ou traduz um resumo completo em português via Groq contextualizado à busca do usuário. */
async function generateAbstractWithGroq(article: Article, userQuery: string): Promise<string> {
  if (!GROQ_API_KEY) return "";
  try {
    const hasAbstract = article.abstract_pt.trim().length > 80;
    const systemPrompt = hasAbstract
      ? "Você é um assistente acadêmico. Traduza o abstract abaixo para português brasileiro de forma completa e fiel, preservando todos os dados numéricos (n amostral, p-valor, HR, OR, IC95%, tamanho de efeito), a estrutura (contexto, objetivo, método, resultados, conclusão) e o nível de detalhe do original. Não omita dados. Responda APENAS com o texto traduzido, sem prefácio."
      : "Você é um assistente acadêmico especializado em síntese de evidências científicas. Com base nos metadados fornecidos, redija um resumo completo em português com 5-6 frases cobrindo: (1) contexto e problema investigado, (2) objetivo do estudo, (3) desenho metodológico e amostra, (4) principais achados com dados numéricos quando inferíveis pelo tipo de estudo, (5) conclusão e implicações clínicas ou práticas. Seja específico e informativo — evite generalidades. Responda APENAS com o resumo, sem título nem prefácio.";

    const userContent = hasAbstract
      ? `Busca do usuário: "${userQuery}"\n\nTítulo: ${article.title}\nPeriódico: ${article.journal}\nTipo: ${article.study_type}\nAno: ${article.year}\nCitações: ${article.citations}\n\nAbstract original:\n${article.abstract_pt.slice(0, 2000)}`
      : `Busca do usuário: "${userQuery}"\n\nTítulo: ${article.title}\nPeriódico: ${article.journal}\nTipo de estudo: ${article.study_type}\nAno: ${article.year}\nCitações: ${article.citations}${article.tldr ? `\nTL;DR (Semantic Scholar): ${article.tldr}` : ""}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.15,
        max_tokens: 450,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

/**
 * Enriquece artigos com abstract, TLDR e resumo em português via Groq:
 * 1) S2 batch (via DOI) — abstract real + tldr para TODOS os artigos com DOI
 * 2) Groq para os top-8 artigos:
 *    - Sem abstract → gera resumo contextualizado à busca
 *    - Com abstract em inglês → traduz e adapta para PT-BR
 * Artigos enriquecidos recebem abstract_generated: true.
 */
async function enrichMissingAbstracts(articles: Article[], userQuery: string): Promise<void> {
  const withDoi = articles.filter((a) => a.doi);
  if (withDoi.length === 0) return;

  // S2 batch para todos com DOI (abstract + tldr)
  const s2Map = await fetchS2AbstractsBatch(withDoi.map((a) => a.doi));

  for (const article of withDoi) {
    const s2 = s2Map[article.doi];
    if (!s2) continue;
    // Sempre salva TLDR quando disponível
    if (s2.tldr) article.tldr = s2.tldr;
    // Preenche abstract vazio com abstract real do S2
    if (!article.abstract_pt.trim() && s2.abstract) {
      article.abstract_pt = s2.abstract;
    }
  }

  // Groq para os top-8: traduz inglês → PT e gera resumos faltantes
  // Artigos PT já têm o abstract no idioma certo, ignorar
  const needsGroq = articles
    .slice(0, 8)
    .filter((a) => a.language !== "pt");

  if (needsGroq.length > 0 && GROQ_API_KEY) {
    const generated = await Promise.allSettled(
      needsGroq.map((a) => generateAbstractWithGroq(a, userQuery))
    );
    for (let i = 0; i < needsGroq.length; i++) {
      const r = generated[i];
      if (r.status === "fulfilled" && r.value) {
        needsGroq[i].abstract_pt = r.value;
        needsGroq[i].abstract_generated = true;
      }
    }
  }
}

// ─── CORE ─────────────────────────────────────────────────────────────────────

async function fetchCORE(query: string): Promise<Article[]> {
  const apiKey = process.env.CORE_API_KEY;
  if (!apiKey) return [];
  const url =
    `https://api.core.ac.uk/v3/search/works` +
    `?q=${encodeURIComponent(query)}&limit=12`;
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${apiKey}`, "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`CORE ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return (data.results ?? [])
    .filter((r) => r.title)
    .map((r) => {
      const doi = cleanDoi(r.doi);
      const authors = (r.authors ?? [])
        .slice(0, 3)
        .map((a: any) => a.name ?? "")
        .filter(Boolean)
        .join(", ");
      return buildArticle({
        title: r.title,
        authors: authors || "Autores não disponíveis",
        year: r.yearPublished ?? null,
        journal: r.journals?.[0]?.title ?? r.publisher ?? "CORE",
        source: "CORE",
        citations: 0,
        is_oa: true,
        doi,
        abstract: r.abstract ?? "",
        ...studyTypeProps(r.documentType ?? r.type ?? "journal-article"),
        url: doi ? `https://doi.org/${doi}` : (r.downloadUrl ?? undefined),
      });
    });
}

// ─── Lens.org ─────────────────────────────────────────────────────────────────

async function fetchLensOrg(query: string): Promise<Article[]> {
  const apiKey = process.env.LENS_API_KEY;
  if (!apiKey) return [];
  const body = {
    query: { match: { title: query } },
    size: 12,
    include: ["title", "authors", "year_published", "source", "references_count", "open_access", "external_ids", "abstract"],
  };
  const res = await fetch("https://api.lens.org/scholarly/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ScholarIA/1.0",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`Lens.org ${res.status}`);
  const data = (await res.json()) as { data: any[] };
  return (data.data ?? [])
    .filter((r) => r.title)
    .map((r) => {
      const doi = cleanDoi((r.external_ids ?? []).find((e: any) => e.type === "doi")?.value);
      const authors = (r.authors ?? [])
        .slice(0, 3)
        .map((a: any) => `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim())
        .filter(Boolean)
        .join(", ");
      return buildArticle({
        title: r.title,
        authors: authors || "Autores não disponíveis",
        year: r.year_published ?? null,
        journal: r.source?.title ?? "Lens.org",
        source: "Lens.org",
        citations: r.references_count ?? 0,
        is_oa: r.open_access?.is_oa ?? false,
        doi,
        abstract: r.abstract ?? "",
        ...studyTypeProps(r.doc_type ?? r.publication_type ?? "journal-article"),
        url: doi ? `https://doi.org/${doi}` : undefined,
      });
    });
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function normTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
}

function dedupe(articles: Article[]): Article[] {
  const seenDoi = new Set<string>();
  const seenTitle = new Set<string>();
  const result: Article[] = [];
  for (const a of articles) {
    if (a.doi && seenDoi.has(a.doi)) continue;
    const nt = normTitle(a.title);
    if (seenTitle.has(nt)) continue;
    if (a.doi) seenDoi.add(a.doi);
    seenTitle.add(nt);
    result.push(a);
  }
  return result;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const q = req.query.q as string;
  const allYears = req.query.all_years === "1";
  if (!q?.trim()) return res.status(400).json({ error: "query obrigatória" });

  const isPsych = isPsychQuery(q);
  console.log(`[api/search] query="${q}" psych=${isPsych} all_years=${allYears}`);

  // Etapa 1 — Expansão semântica estruturada
  const expansion = await expandQuery(q);
  const en0 = expansion.en[0] ?? q;
  const en1 = expansion.en[1] ?? en0;
  const en2 = expansion.en[2] ?? en0;
  const pt0 = expansion.pt[0] ?? q;
  const short = expansion.short ?? q;

  // Etapa 2 — Dispatch por base:
  //   PT bases  (SciELO, BVS, PubMed-PT, DOAJ) → pt[0] ou q original
  //   EN bases  (PubMed, CrossRef, EuropePMC)  → en[0]  (termos MeSH)
  //   Multi     (OpenAlex, S2)                 → en[0..2] em paralelo
  //   Simple    (CORE, Lens.org, PsyArXiv)     → short
  const results = await Promise.allSettled([
    // OpenAlex — 3 variações EN em paralelo + 1 filtro PT
    fetchOpenAlex(en0),
    fetchOpenAlex(en1),
    fetchOpenAlex(en2),
    fetchOpenAlexPT(q),                       // language:pt — SciELO, BVS-LILACS
    // Semantic Scholar — 3 variações EN em paralelo
    fetchSemanticScholar(en0),
    fetchSemanticScholar(en1),
    fetchSemanticScholar(en2),
    // Bases EN com MeSH
    fetchPubMed(en0),
    fetchEuropePMC(en0),
    fetchCrossRef(en0),
    // Bases PT
    fetchPubMedPT(pt0),                       // Portuguese[Language]
    fetchEuropePMCPT(pt0),                    // LANG:por OR LANG:spa
    fetchDOAJ(pt0),                           // revistas abertas PT/BR
    // Bases simples — query curta
    fetchCORE(short),
    fetchLensOrg(short),
    // Psicologia
    ...(isPsych ? [
      fetchSemanticScholarPsych(en0),         // S2 fieldsOfStudy=Psychology
      fetchOpenAlexPsych(q),                  // OpenAlex concepts.id=C15744967
      fetchPsyArXiv(short),                   // PsyArXiv preprints
    ] : []),
  ]);

  const articles: Article[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") articles.push(...r.value);
    else console.error("[api/search] source error:", r.reason);
  }

  if (articles.length === 0) {
    return res.status(502).json({ error: "Nenhuma fonte retornou resultados" });
  }

  // Dedupe (mantém primeira ocorrência — fontes com abstract têm prioridade)
  const unique = dedupe(articles);

  // Enrich em paralelo: abstracts (S2+Groq) e citation counts (PubMed retorna 0)
  await Promise.all([
    enrichMissingAbstracts(unique, q),
    enrichCitationsFromS2(unique),
  ]);

  // Auto-tag PT para fontes que publicam primariamente em português
  for (const a of unique) {
    if (!a.language && (a.source === "SciELO" || a.source === "BVS/LILACS")) {
      a.language = "pt";
    }
  }

  // Reescreve evidence_reason conectando cada artigo à busca do usuário
  for (const a of unique) {
    a.evidence_reason = buildEvidenceReason(a, q);
  }

  // Etapa 4 — Reranking: calcula rawScores ANTES do sort para usar no sort e na tag
  const queryTerms = q
    .toLowerCase()
    .split(/[\s,?!.]+/)
    .filter((t) => t.length > 3);

  const rawScores = unique.map((a) => relevanceScore(a, queryTerms));
  const maxRaw = Math.max(...rawScores, 1);
  // Índice para acesso O(1) no sort
  const scoreIdx = new Map(unique.map((a, i) => [a, rawScores[i]]));

  unique.sort((a, b) => {
    const rawA = scoreIdx.get(a) ?? 0;
    const rawB = scoreIdx.get(b) ?? 0;
    const normA = rawA / maxRaw;
    const normB = rawB / maxRaw;

    // low_relevance → fundo da lista
    const lowA = normA < 0.10 ? 1 : 0;
    const lowB = normB < 0.10 ? 1 : 0;
    if (lowA !== lowB) return lowA - lowB;

    // PT com relevância alta → 1.4× (vantagem competitiva da Clara)
    const ptMultA = (a.language === "pt" && rawA > 0) ? 1.4 : 1.0;
    const ptMultB = (b.language === "pt" && rawB > 0) ? 1.4 : 1.0;
    const relA = rawA * 2 * ptMultA;
    const relB = rawB * 2 * ptMultB;

    // Confidence boost: normaliza 25-95 → 0-3 pontos adicionais
    const confBoostA = (a.confidence_score - 25) / 23.3;
    const confBoostB = (b.confidence_score - 25) / 23.3;

    const scoreA = relA + confBoostA;
    const scoreB = relB + confBoostB;
    if (Math.abs(scoreB - scoreA) > 0.1) return scoreB - scoreA;
    return b.citations - a.citations;
  });

  // Tag relevance_score (0-100) e low_relevance (índice pré-sort era por posição; recomputa por artigo)
  const LOW_RELEVANCE_THRESHOLD = 0.10;
  for (const a of unique) {
    const raw = scoreIdx.get(a) ?? 0;
    const norm = raw / maxRaw;
    a.relevance_score = Math.round(norm * 100);
    if (norm < LOW_RELEVANCE_THRESHOLD) {
      a.low_relevance = true;
      console.log(`[search] low_relevance: "${a.title.slice(0, 60)}" score=${norm.toFixed(3)}`);
    }
  }

  // Etapa 3 — Filtro de data (pós-agregação para contar artigos ocultados com precisão)
  const FROM_YEAR = new Date().getFullYear() - 10;
  let hiddenByYearCount = 0;
  let articlesToReturn = unique;
  if (!allYears) {
    articlesToReturn = unique.filter((a) => {
      const yr = parseInt(a.year);
      if (!yr || yr >= FROM_YEAR) return true;
      hiddenByYearCount++;
      return false;
    });
  }

  const sources = [...new Set(articlesToReturn.map((a) => a.source))];
  return res.status(200).json({
    count: articlesToReturn.length,
    articles: articlesToReturn,
    isPsych,
    sources,
    ...(hiddenByYearCount > 0 ? { hidden_by_year_count: hiddenByYearCount, year_from: FROM_YEAR } : {}),
  });
}

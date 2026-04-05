import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAILTO = "contact@scholaria.app";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ─── Query expansion: PT → EN keywords via Groq ───────────────────────────────
async function expandQueryToEnglish(query: string): Promise<string> {
  if (!GROQ_API_KEY) return query;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a biomedical search expert. Extract 3-5 precise English MeSH/academic keywords from the user's query. Reply with ONLY the keywords joined by ' AND ', nothing else. No explanation.",
          },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 40,
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return query;
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const keywords = data.choices?.[0]?.message?.content?.trim();
    if (keywords && keywords.length > 3) {
      console.log(`[api/search] query expandida: "${keywords}"`);
      return keywords;
    }
  } catch (e) {
    console.warn("[api/search] expansão de query falhou, usando original:", e);
  }
  return query;
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
}

function studyTypeFromLabel(label: string): string {
  const t = label.toLowerCase();
  if (t.includes("meta") || t.includes("systematic")) return "meta-análise";
  if (t.includes("review")) return "revisão sistemática";
  if (t.includes("trial") || t.includes("clinical")) return "ensaio clínico randomizado";
  if (t.includes("case")) return "relato de caso";
  if (t.includes("preprint") || t.includes("posted-content")) return "preprint";
  return "estudo observacional";
}

function evScoreFromStudyType(studyType: string): number {
  if (studyType === "meta-análise" || studyType === "revisão sistemática") return 5;
  if (studyType === "ensaio clínico randomizado") return 4;
  if (studyType === "preprint") return 2;
  return 3;
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
  url?: string;
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
    confidence_score: Math.min(
      95,
      40 + evScore * 8 + Math.min(20, Math.floor(p.citations / 50))
    ),
    confidence_factors: {
      domain_weight: 80,
      peer_reviewed: evScore >= 3,
      study_type_weight: evScore * 15,
      recency_score:
        p.year && p.year >= 2020 ? 100 : p.year && p.year >= 2015 ? 80 : 60,
      citations_weight: Math.min(100, Math.floor(p.citations / 10)),
    },
    ...(p.url ? { url: p.url } : {}),
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
  const doi = (w.doi ?? "").replace("https://doi.org/", "");
  const studyType = studyTypeFromLabel(w.type ?? "");
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
    studyType,
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
    `&per-page=15&select=${OA_FIELDS}` +
    `&mailto=${MAILTO}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`OpenAlexPT ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return (data.results ?? []).filter((w) => w.title).map(mapOpenAlexWork);
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
      const doi = item.DOI ?? "";
      const studyType = studyTypeFromLabel(item.type ?? "");
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
        studyType,
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
        doi: r.doi ?? "",
        abstract: r.abstractText ?? "",
        studyType: studyTypeFromLabel(r.pubType ?? ""),
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
    `&format=json&pageSize=12&resultType=core`;
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
        doi: r.doi ?? "",
        abstract: r.abstractText ?? "",
        studyType: studyTypeFromLabel(r.pubType ?? ""),
        url: r.doi ? `https://doi.org/${r.doi}` : undefined,
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
      const doi = (item.elocationid ?? "").replace("doi: ", "").trim();
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
        studyType: studyTypeFromLabel(pubTypes || item.fulljournalname || ""),
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
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
      const doi = (bib.identifier ?? []).find((i: any) => i.type === "doi")?.id ?? "";
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
      const doi = p.externalIds?.DOI ?? "";
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
        studyType: studyTypeFromLabel(types),
        url: doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${p.paperId}`,
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
  const lang = (req.query.lang as string) ?? "";
  if (!q?.trim()) return res.status(400).json({ error: "query obrigatória" });

  // Expand PT query → EN keywords for broader EN-language coverage
  const expandedQuery = await expandQueryToEnglish(q);
  const langHint =
    lang.includes("pt") || lang.includes("es")
      ? " (Portuguese OR Spanish OR Brasil)"
      : "";
  const finalQuery = expandedQuery + langHint;

  // Run all sources in parallel:
  // - EN sources use the expanded query for broader coverage
  // - PT sources use the original query + language filter for precision
  const results = await Promise.allSettled([
    fetchOpenAlex(finalQuery),
    fetchOpenAlexPT(q),          // SciELO, BVS-LILACS, revistas BR via OpenAlex language:pt
    fetchCrossRef(finalQuery),
    fetchEuropePMC(finalQuery),
    fetchEuropePMCPT(q),         // EuropePMC with LANG:por OR LANG:spa
    fetchSemanticScholar(finalQuery),
    fetchPubMed(finalQuery),
    fetchDOAJ(q),                // DOAJ with original query for better Portuguese journal coverage
  ]);

  const articles: Article[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      articles.push(...r.value);
    } else {
      console.error("[api/search] source error:", r.reason);
    }
  }

  if (articles.length === 0) {
    return res.status(502).json({ error: "Nenhuma fonte retornou resultados" });
  }

  // Dedupe first (keeps first occurrence — sources with abstracts are pushed first)
  const unique = dedupe(articles);

  // Sort: relevance to original query first, then citations as tie-break
  const queryTerms = q
    .toLowerCase()
    .split(/[\s,?!.]+/)
    .filter((t) => t.length > 3);

  unique.sort((a, b) => {
    const relA = relevanceScore(a, queryTerms);
    const relB = relevanceScore(b, queryTerms);
    if (relB !== relA) return relB - relA;
    return b.citations - a.citations;
  });

  return res.status(200).json({ count: unique.length, articles: unique });
}

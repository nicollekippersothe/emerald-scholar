import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAILTO = "contact@scholaria.app";

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
    abstract_pt: p.abstract || "Abstract não disponível.",
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

// ─── OpenAlex ─────────────────────────────────────────────────────────────────

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
  primary_location?: {
    source?: {
      display_name?: string;
      is_in_doaj?: boolean;
    };
  };
  doi?: string;
}): string {
  const src = (
    work.primary_location?.source?.display_name ?? ""
  ).toLowerCase();
  const doi = (work.doi ?? "").toLowerCase();
  if (src.includes("arxiv")) return "arXiv";
  if (src.includes("cochrane") || doi.includes("cochrane")) return "Cochrane";
  if (src.includes("pubmed") || src.includes("medline")) return "PubMed";
  if (src.includes("scielo")) return "SciELO";
  if (src.includes("lilacs") || src.includes("bireme")) return "BVS/LILACS";
  if (src.includes("europe pmc") || src.includes("europepmc"))
    return "Europe PMC";
  if (work.primary_location?.source?.is_in_doaj) return "DOAJ";
  return "OpenAlex";
}

async function fetchOpenAlex(query: string): Promise<Article[]> {
  const fields = [
    "id",
    "title",
    "authorships",
    "publication_year",
    "abstract_inverted_index",
    "cited_by_count",
    "open_access",
    "primary_location",
    "type",
    "doi",
  ].join(",");

  const url =
    `https://api.openalex.org/works` +
    `?search=${encodeURIComponent(query)}` +
    `&per-page=25` +
    `&select=${fields}` +
    `&mailto=${MAILTO}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);

  const data = (await res.json()) as { results: any[] };
  return (data.results ?? [])
    .filter((w) => w.title)
    .map((w) => {
      const authors = (w.authorships ?? [])
        .slice(0, 3)
        .map((a: any) => a.author?.display_name ?? "")
        .filter(Boolean)
        .join(", ");
      const doi = (w.doi ?? "").replace("https://doi.org/", "");
      const studyType = studyTypeFromLabel(w.type ?? "");
      const oaUrl =
        w.open_access?.oa_url ?? (doi ? `https://doi.org/${doi}` : undefined);
      return buildArticle({
        title: w.title,
        authors,
        year: w.publication_year ?? null,
        journal:
          w.primary_location?.source?.display_name ?? "Periódico não informado",
        source: oaSource(w),
        citations: w.cited_by_count ?? 0,
        is_oa: w.open_access?.is_oa ?? false,
        doi,
        abstract: reconstructAbstract(w.abstract_inverted_index),
        studyType,
        url: oaUrl,
      });
    });
}

// ─── CrossRef ─────────────────────────────────────────────────────────────────

async function fetchCrossRef(query: string): Promise<Article[]> {
  const url =
    `https://api.crossref.org/works` +
    `?query=${encodeURIComponent(query)}` +
    `&rows=15` +
    `&mailto=${MAILTO}`;

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
      return buildArticle({
        title,
        authors,
        year,
        journal: journal || "Periódico não informado",
        source: "CrossRef",
        citations: item["is-referenced-by-count"] ?? 0,
        is_oa: false,
        doi,
        abstract: "",
        studyType,
        url: doi ? `https://doi.org/${doi}` : undefined,
      });
    });
}

// ─── Europe PMC ───────────────────────────────────────────────────────────────

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
    `&format=json` +
    `&pageSize=15` +
    `&resultType=core`;

  const res = await fetch(url, {
    headers: { "User-Agent": "ScholarIA/1.0" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`EuropePMC ${res.status}`);

  const data = (await res.json()) as {
    resultList: { result: any[] };
  };
  return (data.resultList?.result ?? [])
    .filter((r) => r.title)
    .map((r) => {
      const studyType = studyTypeFromLabel(r.pubType ?? "");
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
        studyType,
        url: r.doi ? `https://doi.org/${r.doi}` : undefined,
      });
    });
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function normTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 60);
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

  const langHint =
    lang.includes("pt") || lang.includes("es")
      ? " (Portuguese OR Spanish OR Brasil)"
      : "";
  const finalQuery = q + langHint;

  const results = await Promise.allSettled([
    fetchOpenAlex(finalQuery),
    fetchCrossRef(finalQuery),
    fetchEuropePMC(finalQuery),
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

  // Sort by citations desc, then dedupe by DOI and normalized title
  articles.sort((a, b) => b.citations - a.citations);
  const unique = dedupe(articles);

  return res.status(200).json({ count: unique.length, articles: unique });
}

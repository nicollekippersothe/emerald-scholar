import type { VercelRequest, VercelResponse } from "@vercel/node";

const S2_BASE = "https://api.semanticscholar.org/graph/v1";
const S2_FIELDS =
  "paperId,title,authors,year,abstract,citationCount,isOpenAccess,externalIds,venue,openAccessPdf,publicationTypes";

// Map external IDs / venue to one of our 13 source badges
function detectSource(paper: S2Paper): string {
  const ids = paper.externalIds ?? {};
  const venue = (paper.venue ?? "").toLowerCase();
  if (ids.ArXiv) return "arXiv";
  if (
    venue.includes("cochrane") ||
    (ids.DOI ?? "").toLowerCase().includes("cochrane")
  )
    return "Cochrane";
  if (ids.PubMed || ids.PubMedCentral) return "PubMed";
  if (
    venue.includes("scielo") ||
    venue.includes("saúde pública") ||
    venue.includes("salud publica") ||
    venue.includes("revista brasileira") ||
    venue.includes("cadernos")
  )
    return "SciELO";
  if (
    venue.includes("lilacs") ||
    venue.includes("bireme") ||
    venue.includes("panamericana")
  )
    return "BVS/LILACS";
  if (venue.includes("doaj") || paper.isOpenAccess) return "DOAJ";
  if (ids.DOI) return "CrossRef";
  if (ids.MAG) return "OpenAlex";
  return "Semantic Scholar";
}

function detectStudyType(types: string[] | undefined): string {
  if (!types || types.length === 0) return "estudo observacional";
  const t = types.map((x) => x.toLowerCase()).join(" ");
  if (t.includes("meta") || t.includes("systematic")) return "meta-análise";
  if (t.includes("review")) return "revisão sistemática";
  if (t.includes("clinical") || t.includes("trial"))
    return "ensaio clínico randomizado";
  if (t.includes("case")) return "relato de caso";
  return "estudo observacional";
}

interface S2Paper {
  paperId?: string;
  title: string;
  abstract?: string;
  year?: number;
  citationCount?: number;
  isOpenAccess?: boolean;
  venue?: string;
  externalIds?: Record<string, string>;
  authors?: { name: string }[];
  openAccessPdf?: { url: string };
  publicationTypes?: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS para dev local
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const q = req.query.q as string;
  const lang = (req.query.lang as string) ?? "";
  if (!q?.trim()) return res.status(400).json({ error: "query obrigatória" });

  // When PT/ES priority is requested, append language hints to the query so
  // Semantic Scholar surfaces Portuguese and Spanish papers first.
  const langHint =
    lang.includes("pt") || lang.includes("es")
      ? " (Portuguese OR Spanish OR português OR español OR Brasil OR Brazil)"
      : "";
  const finalQuery = q + langHint;

  try {
    const url = `${S2_BASE}/paper/search?query=${encodeURIComponent(finalQuery)}&limit=40&fields=${S2_FIELDS}`;
    const s2Res = await fetch(url, {
      headers: { "User-Agent": "ScholarIA/1.0 (academic-search-tool)" },
    });

    if (!s2Res.ok) {
      throw new Error(`Semantic Scholar retornou ${s2Res.status}`);
    }

    const data = (await s2Res.json()) as { total: number; data: S2Paper[] };
    const papers = data.data ?? [];

    const articles = papers.map((p) => {
      const source = detectSource(p);
      const authors = (p.authors ?? [])
        .slice(0, 3)
        .map((a) => a.name)
        .join(", ");
      const doi = p.externalIds?.DOI ?? "";
      const evidenceScore = p.publicationTypes?.some((t) =>
        ["Review", "Meta-Analysis"].includes(t)
      )
        ? 5
        : p.citationCount && p.citationCount > 500
        ? 4
        : 3;

      return {
        title: p.title,
        authors: authors || "Autores não disponíveis",
        year: String(p.year ?? ""),
        journal: p.venue || "Periódico não informado",
        source,
        citations: p.citationCount ?? 0,
        is_oa: p.isOpenAccess ?? false,
        doi,
        evidence_score: evidenceScore,
        study_type: detectStudyType(p.publicationTypes),
        expert_reviewed: evidenceScore >= 4,
        source_quality: evidenceScore >= 4 ? "alta" : "média",
        potential_bias: "Verificar metodologia no artigo original",
        abstract_pt: p.abstract ?? "Abstract não disponível.",
        evidence_reason: `${detectStudyType(p.publicationTypes)} com ${p.citationCount ?? 0} citações.`,
        abnt: `${(authors || "AUTOR").toUpperCase()}. ${p.title}. ${p.venue || "s.n."}, ${p.year ?? "s.d."}.`,
        confidence_score: Math.min(
          95,
          40 + evidenceScore * 8 + Math.min(20, Math.floor((p.citationCount ?? 0) / 50))
        ),
        confidence_factors: {
          domain_weight: 80,
          peer_reviewed: evidenceScore >= 3,
          study_type_weight: evidenceScore * 15,
          recency_score: p.year && p.year >= 2020 ? 100 : p.year && p.year >= 2015 ? 80 : 60,
          citations_weight: Math.min(100, Math.floor((p.citationCount ?? 0) / 10)),
        },
        ...(p.openAccessPdf?.url ? { pdf_url: p.openAccessPdf.url } : {}),
        ...(p.paperId ? { url: `https://www.semanticscholar.org/paper/${p.paperId}` } : {}),
      };
    });

    return res.status(200).json({
      count: data.total,
      articles,
    });
  } catch (err) {
    console.error("[api/search]", err);
    return res.status(500).json({ error: "Falha ao buscar artigos", details: String(err) });
  }
}

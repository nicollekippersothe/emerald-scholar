/**
 * Testa a lógica do ICM programático (replicada aqui para testar sem importar o serverless).
 * A lógica é idêntica à de api/summarize.ts → computeICM().
 */
import { describe, it, expect } from "vitest";

interface ArticleInput {
  study_type: string;
  source: string;
  citations: number;
}

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
  const total = top.reduce((sum, a) => {
    const ts = STUDY_SCORES[a.study_type] ?? 50;
    const ss = SOURCE_SCORES[a.source] ?? 65;
    const peerBonus = ts >= 65 ? 10 : 0;
    return sum + ts * 0.45 + ss * 0.30 + peerBonus * 0.25;
  }, 0);
  return Math.min(95, Math.max(30, Math.round(total / top.length)));
}

describe("computeICM — lógica do api/summarize", () => {
  it("exercício físico + depressão (meta-análises PubMed) → ICM ≥ 70", () => {
    const articles: ArticleInput[] = Array(8).fill({
      study_type: "meta-análise",
      source: "PubMed",
      citations: 0, // PubMed não retorna citações
    });
    const icm = computeICM(articles);
    // meta-análise (100×0.45=45) + PubMed (90×0.30=27) + peerBonus (10×0.25=2.5) = 74.5
    expect(icm).toBeGreaterThanOrEqual(70);
    expect(icm).toBeLessThanOrEqual(95);
  });

  it("preprints arXiv sem peer-review → ICM < 50", () => {
    const articles: ArticleInput[] = Array(8).fill({
      study_type: "preprint",
      source: "arXiv",
      citations: 0,
    });
    const icm = computeICM(articles);
    // preprint (30×0.45=13.5) + arXiv (55×0.30=16.5) + peerBonus(0) = 30
    expect(icm).toBeLessThan(50);
  });

  it("mix de fontes e tipos resulta em ICM intermediário", () => {
    const articles: ArticleInput[] = [
      { study_type: "meta-análise", source: "Cochrane", citations: 300 },
      { study_type: "ensaio clínico randomizado", source: "PubMed", citations: 100 },
      { study_type: "revisão sistemática", source: "Semantic Scholar", citations: 80 },
      { study_type: "estudo observacional", source: "OpenAlex", citations: 10 },
      { study_type: "preprint", source: "arXiv", citations: 0 },
    ];
    const icm = computeICM(articles);
    expect(icm).toBeGreaterThan(50);
    expect(icm).toBeLessThan(95);
  });

  it("array vazio retorna 50 (fallback)", () => {
    expect(computeICM([])).toBe(50);
  });

  it("considera apenas os primeiros 8 artigos", () => {
    const strong: ArticleInput[] = Array(8).fill({ study_type: "meta-análise", source: "Cochrane", citations: 500 });
    const weak: ArticleInput[] = Array(10).fill({ study_type: "preprint", source: "arXiv", citations: 0 });
    // Primeiros 8 são fortes, mais 10 fracos adicionados
    const icmStrongFirst = computeICM([...strong, ...weak]);
    const icmWeakFirst = computeICM([...weak, ...strong]);
    expect(icmStrongFirst).toBeGreaterThan(icmWeakFirst);
  });

  it("retorna sempre entre 30 e 95", () => {
    const extreme1 = Array(8).fill({ study_type: "meta-análise", source: "Cochrane", citations: 9999 });
    const extreme2 = Array(8).fill({ study_type: "relato de caso", source: "BASE", citations: 0 });
    expect(computeICM(extreme1)).toBeLessThanOrEqual(95);
    expect(computeICM(extreme2)).toBeGreaterThanOrEqual(30);
  });
});

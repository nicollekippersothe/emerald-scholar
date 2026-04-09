/**
 * Testa a lógica do ICM programático (replicada aqui para testar sem importar o serverless).
 * A lógica é idêntica à de api/summarize.ts → computeICM().
 *
 * Pesos atuais: Tipo(35%) Fonte(25%) PeerReview(20%) Citações(15%) Recência(5%) + diversidade
 */
import { describe, it, expect } from "vitest";

interface ArticleInput {
  study_type: string;
  source: string;
  citations: number;
  year?: string;
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
  const baseScore = top.reduce((sum, a) => {
    const ts = STUDY_SCORES[a.study_type] ?? 50;
    const ss = SOURCE_SCORES[a.source] ?? 65;
    const peerBonus = ts >= 65 ? 10 : 0;
    const citW = Math.min(100, Math.floor(a.citations / 2));
    const yr = parseInt(a.year ?? "2018") || 2000;
    const yearW = yr >= 2023 ? 100 : yr >= 2020 ? 90 : yr >= 2018 ? 80 : yr >= 2015 ? 60 : yr >= 2010 ? 40 : 20;
    return sum + ts * 0.35 + ss * 0.25 + peerBonus * 0.20 + citW * 0.15 + yearW * 0.05;
  }, 0) / top.length;
  const uniqueSources = new Set(top.map(a => a.source)).size;
  const diversityBonus = Math.min(15, (uniqueSources - 1) * 4);
  return Math.min(95, Math.max(30, Math.round(baseScore + diversityBonus)));
}

describe("computeICM — lógica do api/summarize", () => {
  it("meta-análises PubMed com citações → ICM ≥ 75", () => {
    const articles: ArticleInput[] = Array(8).fill({
      study_type: "meta-análise",
      source: "PubMed",
      citations: 150,
      year: "2021",
    });
    const icm = computeICM(articles);
    expect(icm).toBeGreaterThanOrEqual(75);
    expect(icm).toBeLessThanOrEqual(95);
  });

  it("preprints arXiv sem peer-review → ICM < 50", () => {
    const articles: ArticleInput[] = Array(8).fill({
      study_type: "preprint",
      source: "arXiv",
      citations: 0,
      year: "2024",
    });
    const icm = computeICM(articles);
    expect(icm).toBeLessThan(50);
  });

  it("artigos de periódico (coorte) com 200 citações + 4 fontes → ICM ≥ 70", () => {
    // Simula o caso 'consequências uso de telas': JournalArticle → coorte, citações medianas
    const articles: ArticleInput[] = [
      { study_type: "coorte", source: "Semantic Scholar", citations: 200, year: "2022" },
      { study_type: "coorte", source: "Semantic Scholar", citations: 180, year: "2021" },
      { study_type: "coorte", source: "OpenAlex",         citations: 250, year: "2020" },
      { study_type: "coorte", source: "PubMed",           citations: 120, year: "2022" },
      { study_type: "coorte", source: "OpenAlex",         citations: 90,  year: "2023" },
      { study_type: "coorte", source: "Semantic Scholar", citations: 300, year: "2019" },
      { study_type: "coorte", source: "PubMed",           citations: 75,  year: "2021" },
      { study_type: "coorte", source: "OpenAlex",         citations: 160, year: "2022" },
    ];
    const icm = computeICM(articles);
    expect(icm).toBeGreaterThanOrEqual(70);
  });

  it("citações altas elevam o ICM vs. citações zero (mesmo tipo e fonte)", () => {
    const withCitations: ArticleInput[] = Array(8).fill({
      study_type: "coorte", source: "PubMed", citations: 400, year: "2020",
    });
    const withoutCitations: ArticleInput[] = Array(8).fill({
      study_type: "coorte", source: "PubMed", citations: 0, year: "2020",
    });
    expect(computeICM(withCitations)).toBeGreaterThan(computeICM(withoutCitations));
  });

  it("mix de fontes e tipos resulta em ICM intermediário", () => {
    const articles: ArticleInput[] = [
      { study_type: "meta-análise", source: "Cochrane", citations: 300, year: "2021" },
      { study_type: "ensaio clínico randomizado", source: "PubMed", citations: 100, year: "2020" },
      { study_type: "revisão sistemática", source: "Semantic Scholar", citations: 80, year: "2022" },
      { study_type: "estudo observacional", source: "OpenAlex", citations: 10, year: "2019" },
      { study_type: "preprint", source: "arXiv", citations: 0, year: "2023" },
    ];
    const icm = computeICM(articles);
    expect(icm).toBeGreaterThan(50);
    expect(icm).toBeLessThan(95);
  });

  it("array vazio retorna 50 (fallback)", () => {
    expect(computeICM([])).toBe(50);
  });

  it("considera apenas os primeiros 8 artigos", () => {
    const strong: ArticleInput[] = Array(8).fill({ study_type: "meta-análise", source: "Cochrane", citations: 500, year: "2022" });
    const weak: ArticleInput[] = Array(10).fill({ study_type: "preprint", source: "arXiv", citations: 0, year: "2023" });
    const icmStrongFirst = computeICM([...strong, ...weak]);
    const icmWeakFirst = computeICM([...weak, ...strong]);
    expect(icmStrongFirst).toBeGreaterThan(icmWeakFirst);
  });

  it("retorna sempre entre 30 e 95", () => {
    const extreme1 = Array(8).fill({ study_type: "meta-análise", source: "Cochrane", citations: 9999, year: "2024" });
    const extreme2 = Array(8).fill({ study_type: "relato de caso", source: "BASE", citations: 0, year: "2005" });
    expect(computeICM(extreme1)).toBeLessThanOrEqual(95);
    expect(computeICM(extreme2)).toBeGreaterThanOrEqual(30);
  });
});

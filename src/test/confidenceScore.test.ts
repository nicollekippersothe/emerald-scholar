import { describe, it, expect } from "vitest";
import { calculateConfidenceScore, getConfidenceLabel } from "@/lib/confidenceScore";

describe("calculateConfidenceScore", () => {
  it("meta-análise peer-reviewed do PubMed recebe score alto (≥ 80)", () => {
    const { score } = calculateConfidenceScore(
      "meta-análise", "PubMed", "Lancet", "2022", 200, true
    );
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("preprint sem peer-review recebe score baixo (< 55)", () => {
    const { score } = calculateConfidenceScore(
      "preprint", "arXiv", "", "2023", 0, false
    );
    expect(score).toBeLessThan(55);
  });

  it("peer-review adiciona pontos significativos vs sem peer-review", () => {
    const withPeer = calculateConfidenceScore(
      "coorte", "PubMed", "", "2021", 30, true
    );
    const withoutPeer = calculateConfidenceScore(
      "coorte", "PubMed", "", "2021", 30, false
    );
    // Peer review contribui 25% do score → diferença deve ser ≥ 20 pontos
    expect(withPeer.score - withoutPeer.score).toBeGreaterThanOrEqual(20);
  });

  it("peso peer-review é 25% (novo valor)", () => {
    // Com peer_review=true: peerBonus = 100 * 0.25 = 25
    // Com peer_review=false: peerBonus = 0 * 0.25 = 0
    // Diferença máxima possível = 25 pontos
    const max = calculateConfidenceScore("meta-análise", "PubMed", "Nature", "2024", 500, true);
    const noReview = calculateConfidenceScore("meta-análise", "PubMed", "Nature", "2024", 500, false);
    expect(max.score - noReview.score).toBe(25);
  });

  it("revisão sistemática da Cochrane recebe label Alta ou Muito Alta", () => {
    const { score } = calculateConfidenceScore(
      "revisão sistemática", "Cochrane", "Cochrane Database", "2023", 150, true
    );
    const label = getConfidenceLabel(score);
    expect(["Alta", "Muito Alta"]).toContain(label);
  });

  it("artigo antigo (>10 anos) recebe penalidade de recência", () => {
    const recent = calculateConfidenceScore("coorte", "PubMed", "", "2023", 50, true);
    const old = calculateConfidenceScore("coorte", "PubMed", "", "2010", 50, true);
    expect(recent.score).toBeGreaterThan(old.score);
  });

  it("factors.peer_reviewed reflete o argumento passado", () => {
    const { factors } = calculateConfidenceScore("coorte", "PubMed", "", "2022", 20, true);
    expect(factors.peer_reviewed).toBe(true);

    const { factors: f2 } = calculateConfidenceScore("coorte", "PubMed", "", "2022", 20, false);
    expect(f2.peer_reviewed).toBe(false);
  });

  it("score sempre entre 0 e 100", () => {
    const cases = [
      ["meta-análise", "PubMed", "Nature", "2024", 9999, true],
      ["preprint", "arXiv", "", "1990", 0, false],
      ["estudo observacional", "BASE", "", "2015", 5, false],
    ] as const;

    for (const [st, src, jn, yr, cit, pr] of cases) {
      const { score } = calculateConfidenceScore(st as string, src as string, jn as string, yr as string, cit, pr);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});

describe("getConfidenceLabel", () => {
  it("80+ → Muito Alta", () => expect(getConfidenceLabel(85)).toBe("Muito Alta"));
  it("65–79 → Alta",     () => expect(getConfidenceLabel(70)).toBe("Alta"));
  it("50–64 → Moderada", () => expect(getConfidenceLabel(55)).toBe("Moderada"));
  it("35–49 → Baixa",    () => expect(getConfidenceLabel(40)).toBe("Baixa"));
  it("<35 → Muito Baixa",() => expect(getConfidenceLabel(20)).toBe("Muito Baixa"));
});

/**
 * Testa studyTypeFromLabel — replicada do api/search.ts para rodar no vitest.
 * Qualquer mudança na função original deve ser espelhada aqui.
 */
import { describe, it, expect } from "vitest";

function studyTypeFromLabel(label: string): string {
  const t = label.toLowerCase();
  if (t.includes("meta-analys") || t.includes("meta analys") || t.includes("metaanalys")) return "meta-análise";
  if ((t.includes("systematic") && t.includes("review")) || t.includes("cochrane")) return "revisão sistemática";
  if (t.includes("systematic")) return "revisão sistemática";
  if (t.includes("narrative review") || t.includes("literature review") || t.includes("scoping review")) return "revisão narrativa";
  if (t.includes("review")) return "revisão sistemática";
  if (t.includes("randomized") || t.includes("randomised") || t.includes(" rct") || t.includes("controlled trial")) return "ensaio clínico randomizado";
  if (t.includes("trial") || t.includes("clinical trial")) return "ensaio clínico randomizado";
  if (t.includes("cohort") || t.includes("coorte") || t.includes("longitudinal") || t.includes("prospective")) return "coorte";
  if (t.includes("case-control") || t.includes("case control")) return "estudo observacional";
  if (t.includes("case report") || t.includes("case series") || t.includes("case study")) return "relato de caso";
  if (t.includes("cross-section") || t.includes("cross section") || t.includes("survey") || t.includes("transversal")) return "estudo transversal";
  if (t.includes("preprint") || t.includes("posted-content")) return "preprint";
  // Artigo em periódico científico = publicação peer-reviewed (design desconhecido, mas validado)
  if (t.includes("journalarticle") || t.includes("journal article") || t.includes("journal-article")) return "coorte";
  return "estudo observacional";
}

describe("studyTypeFromLabel", () => {
  // Meta-análise
  it("meta-analysis → meta-análise", () => expect(studyTypeFromLabel("meta-analysis")).toBe("meta-análise"));
  it("Meta Analysis (espaço) → meta-análise", () => expect(studyTypeFromLabel("Meta Analysis")).toBe("meta-análise"));
  it("Systematic review AND meta-analysis → meta-análise", () =>
    expect(studyTypeFromLabel("Systematic review and meta-analysis")).toBe("meta-análise"));

  // Revisão sistemática
  it("systematic review → revisão sistemática", () => expect(studyTypeFromLabel("systematic review")).toBe("revisão sistemática"));
  it("Cochrane Review → revisão sistemática", () => expect(studyTypeFromLabel("Cochrane Review")).toBe("revisão sistemática"));
  it("review (genérico) → revisão sistemática", () => expect(studyTypeFromLabel("review")).toBe("revisão sistemática"));

  // Revisão narrativa (BUG corrigido: antes retornava revisão sistemática)
  it("narrative review → revisão narrativa", () => expect(studyTypeFromLabel("narrative review")).toBe("revisão narrativa"));
  it("literature review → revisão narrativa", () => expect(studyTypeFromLabel("literature review")).toBe("revisão narrativa"));
  it("scoping review → revisão narrativa", () => expect(studyTypeFromLabel("scoping review")).toBe("revisão narrativa"));

  // ECR
  it("Randomized Controlled Trial → ECR", () => expect(studyTypeFromLabel("Randomized Controlled Trial")).toBe("ensaio clínico randomizado"));
  it("randomised controlled trial → ECR", () => expect(studyTypeFromLabel("randomised controlled trial")).toBe("ensaio clínico randomizado"));
  it("clinical trial → ECR", () => expect(studyTypeFromLabel("clinical trial")).toBe("ensaio clínico randomizado"));

  // Coorte (BUG corrigido: antes retornava estudo observacional)
  it("cohort study → coorte", () => expect(studyTypeFromLabel("cohort study")).toBe("coorte"));
  it("longitudinal study → coorte", () => expect(studyTypeFromLabel("longitudinal study")).toBe("coorte"));
  it("prospective study → coorte", () => expect(studyTypeFromLabel("prospective study")).toBe("coorte"));

  // Relato de caso (BUG corrigido: case-control não deve virar relato de caso)
  it("case report → relato de caso", () => expect(studyTypeFromLabel("case report")).toBe("relato de caso"));
  it("case series → relato de caso", () => expect(studyTypeFromLabel("case series")).toBe("relato de caso"));
  it("case-control → estudo observacional (NÃO relato de caso)", () =>
    expect(studyTypeFromLabel("case-control study")).toBe("estudo observacional"));
  it("case control → estudo observacional (NÃO relato de caso)", () =>
    expect(studyTypeFromLabel("case control study")).toBe("estudo observacional"));

  // Estudo transversal
  it("cross-sectional → estudo transversal", () => expect(studyTypeFromLabel("cross-sectional study")).toBe("estudo transversal"));
  it("survey → estudo transversal", () => expect(studyTypeFromLabel("survey")).toBe("estudo transversal"));

  // Preprint
  it("preprint → preprint", () => expect(studyTypeFromLabel("preprint")).toBe("preprint"));
  it("posted-content → preprint", () => expect(studyTypeFromLabel("posted-content")).toBe("preprint"));

  // JournalArticle (S2/OpenAlex) → coorte (peer-reviewed, design desconhecido mas validado)
  it("journal-article → coorte", () => expect(studyTypeFromLabel("journal-article")).toBe("coorte"));
  it("JournalArticle (S2 publicationType) → coorte", () => expect(studyTypeFromLabel("JournalArticle")).toBe("coorte"));
  it("journal article (espaço) → coorte", () => expect(studyTypeFromLabel("journal article")).toBe("coorte"));

  // Fallback
  it("string vazia → estudo observacional", () => expect(studyTypeFromLabel("")).toBe("estudo observacional"));
});

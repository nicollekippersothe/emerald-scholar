/**
 * Confidence Score Algorithm (0-100)
 * Weights research quality, domain authority, peer review, recency, and citations
 */

export interface ConfidenceFactors {
  domain_weight: number;           // .gov, .edu, .org, etc.
  peer_reviewed: boolean;
  study_type_weight: number;       // Meta-analysis, RCT, etc.
  recency_score: number;           // 0-100 based on publication date
  citations_weight: number;        // 0-100 based on citation count
}

// Study type weights (0-100)
const STUDY_TYPE_WEIGHTS: Record<string, number> = {
  "meta-análise": 100,
  "revisão sistemática": 85,
  "ensaio clínico randomizado": 75,
  "coorte": 65,
  "transversal": 50,
  "revisão narrativa": 40,
  "opinião de especialista": 35,
  "relato de caso": 30,
};

// Domain weights (0-100)
const DOMAIN_WEIGHTS: Record<string, number> = {
  ".gov": 95,
  ".edu": 85,
  ".org": 70,
  "pubmed": 90,
  "semantic scholar": 85,
  "nature": 95,
  "science": 95,
  "lancet": 95,
  "jama": 95,
  "bmj": 90,
};

/**
 * Calculate recency score (0-100)
 * 0-2 years: 100, 2-5: 80, 5-10: 60, 10+: 40
 */
function calculateRecencyScore(publicationYear: string | number): number {
  const year = typeof publicationYear === "string" ? parseInt(publicationYear, 10) : publicationYear;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age <= 2) return 100;
  if (age <= 5) return 80;
  if (age <= 10) return 60;
  return 40;
}

/**
 * Calculate citations weight (0-100)
 * Highly cited: 100, Medium: 50, Low/None: 0
 */
function calculateCitationsWeight(citations: number): number {
  if (citations >= 100) return 100;
  if (citations >= 50) return 80;
  if (citations >= 10) return 50;
  return 20;
}

/**
 * Get study type weight from study type string
 */
function getStudyTypeWeight(studyType: string): number {
  const normalized = studyType.toLowerCase();
  
  // Direct match
  if (STUDY_TYPE_WEIGHTS[normalized]) {
    return STUDY_TYPE_WEIGHTS[normalized];
  }
  
  // Fuzzy match
  for (const [key, weight] of Object.entries(STUDY_TYPE_WEIGHTS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return weight;
    }
  }
  
  return 50; // Default for unknown types
}

/**
 * Get domain weight from source/journal name
 */
function getDomainWeight(source: string, journal: string): number {
  const combined = `${source} ${journal}`.toLowerCase();
  
  // Direct match
  for (const [domain, weight] of Object.entries(DOMAIN_WEIGHTS)) {
    if (combined.includes(domain)) {
      return weight;
    }
  }
  
  // Default weights by source type
  if (source.includes("PubMed")) return 90;
  if (source.includes("OpenAlex")) return 80;
  if (source.includes("Semantic Scholar")) return 85;
  if (source.includes("CrossRef")) return 80;
  if (source.includes("DOAJ")) return 75;
  if (source.includes("SciELO")) return 75;
  if (source.includes("arXiv")) return 70; // Preprints lower weight
  if (source.includes("BASE")) return 70;
  if (source.includes("CORE")) return 70;
  if (source.includes("Lens.org")) return 70;
  
  return 60; // Unknown source
}

/**
 * Main scoring function
 * Returns 0-100 confidence score with breakdown
 */
export function calculateConfidenceScore(
  studyType: string,
  source: string,
  journal: string,
  publicationYear: string | number,
  citations: number,
  expertReviewed: boolean
): { score: number; factors: ConfidenceFactors } {
  
  const studyTypeWeight = getStudyTypeWeight(studyType);
  const domainWeight = getDomainWeight(source, journal);
  const peerReviewBonus = expertReviewed ? 100 : 0;
  const recencyScore = calculateRecencyScore(publicationYear);
  const citationsWeight = calculateCitationsWeight(citations);

  // Weighted calculation
  // Study Type (30%), Domain (25%), Peer Review (20%), Recency (15%), Citations (10%)
  const score = Math.round(
    (studyTypeWeight * 0.3) +
    (domainWeight * 0.25) +
    (peerReviewBonus * 0.2) +
    (recencyScore * 0.15) +
    (citationsWeight * 0.1)
  );

  const factors: ConfidenceFactors = {
    domain_weight: domainWeight,
    peer_reviewed: expertReviewed,
    study_type_weight: studyTypeWeight,
    recency_score: recencyScore,
    citations_weight: citationsWeight,
  };

  return {
    score: Math.min(100, Math.max(0, score)),
    factors,
  };
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(score: number): string {
  if (score >= 80) return "Muito Alta";
  if (score >= 65) return "Alta";
  if (score >= 50) return "Moderada";
  if (score >= 35) return "Baixa";
  return "Muito Baixa";
}

/**
 * Get confidence color class (Tailwind)
 */
export function getConfidenceColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 65) return "bg-green-400";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 35) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Generate detailed tooltip explanation
 */
export function getConfidenceExplanation(factors: ConfidenceFactors): string[] {
  const explanations: string[] = [];

  // Study type
  if (factors.study_type_weight >= 80) {
    explanations.push("✓ Metodologia robusta (Meta-análise/Rev. Sistemática)");
  } else if (factors.study_type_weight >= 70) {
    explanations.push("✓ Estudo de alta qualidade (RCT)");
  } else if (factors.study_type_weight >= 50) {
    explanations.push("⚠️ Tipo de estudo moderado (Coorte/Transversal)");
  } else {
    explanations.push("⚠️ Tipo de estudo descritivo (Narrativa)");
  }

  // Domain
  if (factors.domain_weight >= 85) {
    explanations.push("✓ Fonte de autoridade máxima (.gov, .edu, Nature, Science)");
  } else if (factors.domain_weight >= 75) {
    explanations.push("✓ Fonte respeitada na comunidade científica");
  } else if (factors.domain_weight >= 60) {
    explanations.push("ℹ️ Fonte com indexação válida");
  } else {
    explanations.push("⚠️ Fonte não verificada ou baixa indexação");
  }

  // Peer review
  if (factors.peer_reviewed) {
    explanations.push("✓ Revisado por pares (peer-review)");
  } else {
    explanations.push("⚠️ Sem revisão por pares (preprint ou sem avaliação)");
  }

  // Recency
  if (factors.recency_score >= 80) {
    explanations.push("✓ Publicação recente (0-5 anos)");
  } else if (factors.recency_score >= 60) {
    explanations.push("ℹ️ Publicação moderadamente recente (5-10 anos)");
  } else {
    explanations.push("⚠️ Publicação antiga (10+ anos) — validar se ainda é relevante");
  }

  // Citations
  if (factors.citations_weight >= 80) {
    explanations.push("✓ Altamente citado na comunidade");
  } else if (factors.citations_weight >= 50) {
    explanations.push("⚠️ Citação moderada");
  } else {
    explanations.push("ℹ️ Citações baixas ou nenhuma (pode ser recente)");
  }

  return explanations;
}

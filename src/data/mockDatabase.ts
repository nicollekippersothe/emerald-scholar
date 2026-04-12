/**
 * Tipos e constantes compartilhados da Clara.
 * Os dados mock foram removidos — a app usa APIs reais em produção.
 */

export interface ConfidenceFactors {
  domain_weight: number;
  peer_reviewed: boolean;
  study_type_weight: number;
  recency_score: number;
  citations_weight: number;
}

export interface Article {
  id?: string;
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
  confidence_factors: ConfidenceFactors;
  pdf_url?: string;
  url?: string;
  /** idioma principal do artigo: 'pt' = português, 'en' = inglês, 'es' = espanhol */
  language?: 'pt' | 'en' | 'es';
  /** síntese curta do achado principal (1-2 frases em português) */
  sintese?: string;
  /** true quando o abstract foi estimado por IA (S2 fallback ou geração Groq) */
  abstract_generated?: boolean;
  /** TL;DR do Semantic Scholar — resumo de 1-2 frases baseado no paper real */
  tldr?: string;
  /** Indica se o ICM foi calculado com base em texto completo ou apenas resumo */
  icm_source?: "full_text" | "abstract";
  /** true quando o tipo de estudo foi inferido do tipo de publicação, não do design real */
  study_type_inferred?: boolean;
  /** Score de relevância semântica 0-100 em relação à query do usuário */
  relevance_score?: number;
  /** true quando o artigo tem baixo overlap com os termos da busca */
  low_relevance?: boolean;
}

export interface CitedSource {
  index: number;
  title: string;
  doi: string;
  citations: number;
  venue_type: "journal" | "conference" | "preprint" | "other";
  evidence_level: string;
  year?: string;
  authors?: string;
}

export interface ArticleSummary {
  /** Focado em metodologia, N amostral, resultados estatísticos, conclusão principal */
  resumo_tecnico: string;
  /** Linguagem simples, analogias, impacto no dia a dia */
  resumo_popular: string;
  /** Ex: "Revisão Sistemática" | "Ensaio Clínico" | "Coorte" | "Preprint" */
  evidence_level_badge: string;
  /** Título traduzido para PT-BR (opcional — presente quando título original está em outro idioma) */
  title_pt?: string;
}

export interface Synthesis {
  direct_answer: string;
  inline_synthesis?: string;
  cited_sources?: CitedSource[];
  consensus_agree: number;
  consensus_inconclusive: number;
  consensus_contradict: number;
  confidence_level: string;
  confidence_score: number;
  confidence_reasons: string[];
  inconclusive_summary: string;
  contradict_explanation: string;
  practical_insight: string;
  search_tip: string;
  study_recortes?: string[];
  maturity_label?: string;
  resumos_pt?: Record<string, string>;
  /** Resumo técnico + popular + badge por artigo (chave = doi ou "n/a-{índice}") */
  article_summaries?: Record<string, ArticleSummary>;
}

export interface MockEntry {
  keywords: string[];
  count: number;
  broad?: boolean;
  articles: Article[];
  synthesis: Synthesis;
}

export type QueryType = "hypothesis" | "broad" | "comparison";

export const classifyQuery = (q: string): QueryType => {
  const ql = q.toLowerCase().trim();
  if (/vs\.?|versus|ou.{1,20}ou|comparad|melhor.*pior|pior.*melhor/.test(ql)) return "comparison";
  const causalWords = /reduz|aumenta|melhora|causa|previne|trata|afeta|impacta|associa|relaciona|diminui|eleva|piora|beneficia|prejudica|influencia|provoca|leva a|resulta|gera|favorece|protege|ajuda|existe|vício|vicia/i;
  const questionWords = /\?|será que|é verdade|funciona|eficaz|efetivo/i;
  if (causalWords.test(ql) || (questionWords.test(ql) && ql.split(" ").length > 3)) return "hypothesis";
  return "broad";
};

export const STUDY_TYPE_MAP: Record<string, { icon: string; label: string }> = {
  "meta-análise": { icon: "🏆", label: "Meta-análise" },
  "revisão sistemática": { icon: "🔬", label: "Revisão Sistemática" },
  "ensaio clínico randomizado": { icon: "🎯", label: "Ensaio Clínico Randomizado" },
  "coorte": { icon: "👥", label: "Estudo de Coorte" },
  "estudo observacional": { icon: "📸", label: "Estudo Observacional" },
  "revisão narrativa": { icon: "📝", label: "Revisão Narrativa" },
};

export const EVIDENCE_LABELS: Record<number, string> = {
  5: "Muito forte",
  4: "Boa evidência",
  3: "Moderada",
  2: "Limitada",
  1: "Muito limitada",
};

export const CONFIDENCE_EXPLANATIONS: Record<string, string> = {
  "alta": "A confiança é ALTA porque os estudos incluem meta-análises e/ou revisões sistemáticas de alta qualidade, com consistência entre resultados e baixo risco de viés.",
  "média": "A confiança é MODERADA porque, embora existam estudos de qualidade, há limitações como amostras pequenas, poucos ensaios clínicos randomizados ou questões de causalidade não completamente resolvidas.",
  "baixa": "A confiança é BAIXA porque os estudos disponíveis são principalmente observacionais, com amostras limitadas, alto risco de viés ou resultados inconsistentes entre si.",
};

export const SOURCE_LIST = [
  "PubMed", "OpenAlex", "Semantic Scholar", "CrossRef", "DOAJ", "SciELO", "arXiv",
  "Europe PMC", "BASE", "Lens.org", "CORE", "Cochrane", "BVS/LILACS",
];

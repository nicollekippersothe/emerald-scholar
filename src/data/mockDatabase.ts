export interface Article {
  title: string;
  authors: string;
  year: string;
  journal: string;
  source: string;
  evidence_score: number;
  study_type: string;
  abstract_pt: string;
  evidence_reason: string;
}

export interface Synthesis {
  direct_answer: string;
  consensus_agree: number;
  consensus_inconclusive: number;
  consensus_contradict: number;
  confidence_level: string;
  practical_insight: string;
  search_tip: string;
}

export interface MockEntry {
  keywords: string[];
  count: number;
  articles: Article[];
  synthesis: Synthesis;
}

export const MOCK_DB: MockEntry[] = [
  {
    keywords: ["exercício", "aeróbico", "depressão", "depression", "exercise"],
    count: 18,
    articles: [
      {
        title: "Exercise as a treatment for depression: A meta-analysis",
        authors: "Blumenthal, J. A., et al.",
        year: "2023",
        journal: "JAMA Psychiatry",
        source: "PubMed",
        evidence_score: 5,
        study_type: "meta-análise",
        abstract_pt:
          "Esta meta-análise de 45 ensaios clínicos mostrou que o exercício aeróbico tem eficácia comparável aos antidepressivos em casos leves.",
        evidence_reason: "Meta-análise com 45 ECRs e baixo risco de viés.",
      },
    ],
    synthesis: {
      direct_answer:
        "O exercício aeróbico reduz significativamente os sintomas da depressão clínica, sendo uma base sólida para tratamento complementar.",
      consensus_agree: 78,
      consensus_inconclusive: 15,
      consensus_contradict: 7,
      confidence_level: "alta",
      practical_insight:
        "30 min de aeróbico 3x/semana já mostram benefícios em 4 semanas.",
      search_tip: "Tente buscar por 'intensidade do exercício e saúde mental'.",
    },
  },
  {
    keywords: ["saúde única", "one health", "zoonose", "saúde animal", "ambiental"],
    count: 31,
    articles: [
      {
        title: "One Health approach: integrating surveillance",
        authors: "Zinsstag, J., et al.",
        year: "2023",
        journal: "The Lancet",
        source: "PubMed",
        evidence_score: 4,
        study_type: "revisão sistemática",
        abstract_pt:
          "A abordagem integrada One Health reduziu custos de vigilância em 22% e detectou surtos 18 dias antes do normal.",
        evidence_reason: "Revisão sistemática com escopo global.",
      },
    ],
    synthesis: {
      direct_answer:
        "Saúde Única é a integração essencial entre saúde humana, animal e ambiental para prevenir pandemias e resistências antimicrobianas.",
      consensus_agree: 90,
      consensus_inconclusive: 10,
      consensus_contradict: 0,
      confidence_level: "alta",
      practical_insight:
        "Vigilância integrada economiza recursos públicos e salva vidas precocemente.",
      search_tip: "Refine para 'resistência antimicrobiana One Health'.",
    },
  },
];

export const findMatch = (query: string): MockEntry | null => {
  const ql = query.toLowerCase();
  return MOCK_DB.find((m) => m.keywords.some((k) => ql.includes(k))) || MOCK_DB[0];
};

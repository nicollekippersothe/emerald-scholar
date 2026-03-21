export interface Article {
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
}

export interface Synthesis {
  direct_answer: string;
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
}

export interface MockEntry {
  keywords: string[];
  count: number;
  broad?: boolean;
  articles: Article[];
  synthesis: Synthesis;
}

export const MOCK_DB: MockEntry[] = [
  {
    keywords: ["exercício","aeróbico","depressão","depression","exercise"],
    count: 18,
    articles: [
      { title:"Exercise as a treatment for depression: A meta-analysis", authors:"Blumenthal, J. A., Babyak, M. A., Moore, K. A.", year:"2023", journal:"JAMA Psychiatry", source:"PubMed", citations:2847, is_oa:true, doi:"10.1001/jamapsychiatry.2023.1234", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Esta meta-análise avaliou 45 ensaios clínicos randomizados com 3.247 participantes. O exercício aeróbico de intensidade moderada mostrou redução significativa nos sintomas depressivos (p<0,001), com efeito comparável aos antidepressivos.", evidence_reason:"Meta-análise com 45 ECRs, amostras grandes e baixo risco de viés.", abnt:"BLUMENTHAL, J. A.; BABYAK, M. A.; MOORE, K. A. Exercise as a treatment for depression. JAMA Psychiatry, v. 80, n. 4, p. 388-397, 2023." },
      { title:"Aerobic exercise and depressive symptoms: A systematic review of randomized trials", authors:"Kvam, S., Kleppe, C. L., Nordhus, I. H.", year:"2022", journal:"Journal of Affective Disorders", source:"Semantic Scholar", citations:1203, is_oa:false, doi:"10.1016/j.jad.2022.05.040", evidence_score:5, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão sistemática de 23 ECRs avaliando exercício aeróbico em adultos com depressão maior. Os resultados indicam que exercício aeróbico de 3x/semana por 8 semanas reduz sintomas depressivos em 47% dos participantes.", evidence_reason:"Revisão sistemática rigorosa com protocolo PRISMA.", abnt:"KVAM, S.; KLEPPE, C. L.; NORDHUS, I. H. Aerobic exercise and depressive symptoms. Journal of Affective Disorders, v. 307, p. 234-241, 2022." },
      { title:"Physical activity and depression in older adults: cohort study", authors:"Harvey, S. B., Overland, S., Hatch, S. L.", year:"2021", journal:"American Journal of Psychiatry", source:"OpenAlex", citations:876, is_oa:true, doi:"10.1176/appi.ajp.2021.20101559", evidence_score:3, study_type:"coorte", expert_reviewed:true, source_quality:"alta", potential_bias:"Possível viés de causalidade reversa: depressão pode reduzir atividade física.", abstract_pt:"Estudo de coorte com 33.908 adultos acompanhados por 11 anos. Participantes com atividade física regular tiveram 44% menos risco de desenvolver depressão, independente de outros fatores de risco.", evidence_reason:"Coorte grande e longa, mas não prova causalidade direta.", abnt:"HARVEY, S. B.; OVERLAND, S.; HATCH, S. L. Physical activity and depression in older adults. American Journal of Psychiatry, v. 178, n. 10, p. 946-956, 2021." },
    ],
    synthesis: { direct_answer:"Com base em 18 estudos analisados, o exercício aeróbico reduz significativamente os sintomas da depressão clínica, com eficácia comparável aos antidepressivos em casos leves a moderados. A evidência é consistente em diferentes populações e durações de intervenção.", consensus_agree:78, consensus_inconclusive:15, consensus_contradict:7, confidence_level:"alta", confidence_score:4, confidence_reasons:["Três meta-análises de alta qualidade concordam","ECRs com amostras representativas"], inconclusive_summary:"Não está claro qual modalidade ou intensidade de exercício é mais eficaz.", contradict_explanation:"7% dos estudos em pacientes com depressão grave não encontraram diferença significativa em relação ao placebo.", practical_insight:"Para adultos com depressão leve a moderada, 30 min de exercício aeróbico 3x/semana já mostram benefícios mensuráveis em 4-8 semanas.", search_tip:"" },
  },
  {
    keywords: ["retinol","linhas finas","rugas","envelhecimento","pele","skin","aging"],
    count: 22,
    articles: [
      { title:"Retinoids in the treatment of skin aging: an overview of clinical efficacy and safety", authors:"Kafi, R., Kwak, H. S. R., Schumaker, W. E.", year:"2022", journal:"Clinical Interventions in Aging", source:"PubMed", citations:1843, is_oa:true, doi:"10.2147/CIA.S24600", evidence_score:5, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão sistemática de 31 ECRs demonstrando que retinol 0,1% a 1% aplicado topicamente reduz significativamente linhas finas, hiperpigmentação e perda de elasticidade após 12 semanas de uso contínuo.", evidence_reason:"Revisão sistemática com meta-análise de 31 ECRs, alta consistência entre os estudos.", abnt:"KAFI, R. et al. Retinoids in the treatment of skin aging. Clinical Interventions in Aging, v. 17, p. 1201-1212, 2022." },
      { title:"Randomized controlled trial of topical retinol versus placebo for facial aging in adults over 40", authors:"Mukherjee, S., Date, A., Patravale, V.", year:"2021", journal:"Journal of Dermatological Science", source:"Semantic Scholar", citations:934, is_oa:false, doi:"10.1016/j.jdermsci.2021.03.008", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Financiado pelo fabricante; risco de viés moderado.", abstract_pt:"ECR duplo-cego com 240 participantes usando retinol 0,5% vs. placebo por 24 semanas. O grupo retinol apresentou redução de 32% nas linhas periorbitais (p=0,003) e melhora de 28% na firmeza da pele.", evidence_reason:"RCT duplo-cego com tamanho amostral adequado e desfechos objetivos.", abnt:"MUKHERJEE, S.; DATE, A.; PATRAVALE, V. Randomized controlled trial of topical retinol. Journal of Dermatological Science, v. 62, p. 183-191, 2021." },
      { title:"Mechanism of action of retinol and retinoic acid in skin photoaging: collagen synthesis pathway", authors:"Zouboulis, C. C., Makrantonaki, E.", year:"2020", journal:"Dermato-Endocrinology", source:"OpenAlex", citations:512, is_oa:true, doi:"10.4161/derm.26499", evidence_score:2, study_type:"revisão narrativa", expert_reviewed:true, source_quality:"média", potential_bias:"Revisão não sistemática — seleção subjetiva dos estudos.", abstract_pt:"Revisão dos mecanismos moleculares pelo qual retinol estimula síntese de colágeno tipo I e III via receptores RAR/RXR, inibindo metaloproteases e revertendo danos por fotoenvelhecimento.", evidence_reason:"Revisão narrativa com boa cobertura mecanicista, mas sem análise estatística própria.", abnt:"ZOUBOULIS, C. C.; MAKRANTONAKI, E. Mechanism of action of retinol in skin photoaging. Dermato-Endocrinology, v. 12, n. 1, 2020." },
    ],
    synthesis: { direct_answer:"Com base em 22 estudos analisados, o retinol tópico (0,1%–1%) reduz linhas finas e melhora a textura da pele de forma estatisticamente significativa em adultos. O efeito é dose-dependente e requer uso contínuo de 12 a 24 semanas para resultados clinicamente relevantes.", consensus_agree:82, consensus_inconclusive:12, consensus_contradict:6, confidence_level:"alta", confidence_score:4, confidence_reasons:["Múltiplos ECRs duplo-cego de alta qualidade","Revisão sistemática com meta-análise disponível"], inconclusive_summary:"A concentração ideal e o protocolo de aplicação (frequência, associação com outros ativos) ainda variam entre estudos.", contradict_explanation:"Alguns estudos não encontraram diferença significativa em fototipos mais escuros (Fitzpatrick IV-VI).", practical_insight:"Retinol 0,3%–0,5% à noite, com fotoproteção diária, é o protocolo com melhor relação eficácia/tolerabilidade documentado em estudos.", search_tip:"" },
  },
  {
    keywords: ["sono","fragmentado","alzheimer","sleep","memória","memory","demência"],
    count: 14,
    articles: [
      { title:"Sleep fragmentation and risk of Alzheimer's disease: a prospective cohort study", authors:"Lucey, B. P., Hicks, T. J., McLeland, J. S.", year:"2023", journal:"Nature Medicine", source:"PubMed", citations:1102, is_oa:false, doi:"10.1038/s41591-023-02211-7", evidence_score:3, study_type:"coorte", expert_reviewed:true, source_quality:"alta", potential_bias:"Possível causalidade reversa — Alzheimer pré-clínico pode causar fragmentação do sono.", abstract_pt:"Estudo de coorte prospectivo com 4.417 adultos acompanhados por 8 anos. Participantes com fragmentação severa do sono tiveram 1,68× mais risco de desenvolver Alzheimer (HR=1,68; IC95% 1,23-2,29), independentemente de APOE-ε4.", evidence_reason:"Coorte prospectiva longa com controle de múltiplos confundidores, mas não prova causalidade.", abnt:"LUCEY, B. P. et al. Sleep fragmentation and risk of Alzheimer's disease. Nature Medicine, v. 29, p. 445-454, 2023." },
      { title:"Slow-wave sleep disruption increases cerebrospinal fluid amyloid-β levels", authors:"Ju, Y. E., McLeland, J. S., Toedebusch, C. D.", year:"2021", journal:"Brain", source:"Semantic Scholar", citations:876, is_oa:true, doi:"10.1093/brain/awu052", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"ECR cruzado com 20 participantes saudáveis. A interrupção experimental do sono de ondas lentas por uma única noite elevou os níveis de β-amiloide no LCR em 10% (p=0,03), sugerindo que o sono profundo limpa resíduos neurotóxicos.", evidence_reason:"RCT experimental com medida direta de biomarcador de Alzheimer; amostra pequena.", abnt:"JU, Y. E. et al. Slow-wave sleep disruption increases cerebrospinal fluid amyloid-β. Brain, v. 137, n. 10, p. 2806-2815, 2021." },
      { title:"Systematic review of sleep disturbances and dementia risk", authors:"Bubu, O. M., Brannick, M., Mortimer, J.", year:"2022", journal:"Sleep", source:"OpenAlex", citations:743, is_oa:false, doi:"10.5665/sleep.6390", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Meta-análise de 27 estudos prospectivos (69.216 participantes). Distúrbios do sono estão associados a risco 1,55× maior de demência geral e 1,65× de Alzheimer especificamente. A associação persiste após ajuste para depressão e comorbidades.", evidence_reason:"Meta-análise com grande N amostral e análise de heterogeneidade rigorosa.", abnt:"BUBU, O. M. et al. Systematic review of sleep disturbances and dementia risk. Sleep, v. 40, n. 1, 2022." },
    ],
    synthesis: { direct_answer:"Com base em 14 estudos analisados, a fragmentação do sono está consistentemente associada ao aumento do risco de Alzheimer. A evidência sugere um mecanismo causal via acúmulo de β-amiloide durante o sono interrompido, embora causalidade reversa não possa ser completamente excluída.", consensus_agree:71, consensus_inconclusive:22, consensus_contradict:7, confidence_level:"média", confidence_score:3, confidence_reasons:["Meta-análise de alta qualidade disponível","Mecanismo biológico plausível documentado em RCT"], inconclusive_summary:"Não está claro se a relação é causal ou se o Alzheimer pré-clínico causa fragmentação do sono (causalidade reversa).", contradict_explanation:"Estudos com medidas objetivas do sono (polissonografia) mostram associações mais fracas do que os que usam questionários de autorrelato.", practical_insight:"Manter 7-9h de sono consolidado, especialmente o sono de ondas lentas, pode ser uma estratégia preventiva de baixo custo e baixo risco.", search_tip:"" },
  },
  {
    keywords: ["mindfulness","meditação","ansiedade","meditation","anxiety","estresse","stress"],
    count: 19,
    articles: [
      { title:"Mindfulness-based stress reduction and anxiety: a meta-analysis", authors:"Hofmann, S. G., Sawyer, A. T., Witt, A. A.", year:"2022", journal:"Journal of Consulting and Clinical Psychology", source:"PubMed", citations:2341, is_oa:false, doi:"10.1037/a0018555", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Meta-análise de 39 estudos (1.140 participantes) avaliando MBSR e MBCT. Efeito moderado-grande na redução de ansiedade (d=0,63) e depressão (d=0,59), com manutenção do efeito em follow-up de até 12 meses.", evidence_reason:"Meta-análise rigorosa com análise de heterogeneidade e viés de publicação.", abnt:"HOFMANN, S. G.; SAWYER, A. T.; WITT, A. A. Mindfulness-based stress reduction and anxiety. Journal of Consulting and Clinical Psychology, v. 78, n. 2, p. 169-183, 2022." },
      { title:"Randomized trial of mindfulness meditation for generalized anxiety disorder", authors:"Hoge, E. A., Bui, E., Marques, L.", year:"2021", journal:"JAMA Psychiatry", source:"Semantic Scholar", citations:987, is_oa:true, doi:"10.1001/jamapsychiatry.2021.1183", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"ECR comparando MBSR com psicoeducação sobre estresse em 276 adultos com TAG. O grupo MBSR apresentou redução superior nos sintomas de ansiedade (HAM-A) na semana 8 (d=0,41, p<0,001).", evidence_reason:"RCT com grupo controle ativo e desfecho primário pré-registrado.", abnt:"HOGE, E. A. et al. Randomized trial of mindfulness meditation for anxiety. JAMA Psychiatry, v. 78, n. 8, p. 844-853, 2021." },
      { title:"Neural correlates of mindfulness meditation: prefrontal cortex and amygdala reactivity", authors:"Hölzel, B. K., Carmody, J., Vangel, M.", year:"2020", journal:"NeuroImage", source:"OpenAlex", citations:623, is_oa:false, doi:"10.4161/derm.26499", evidence_score:3, study_type:"estudo observacional", expert_reviewed:true, source_quality:"alta", potential_bias:"Amostra de conveniência; praticantes experientes vs. iniciantes.", abstract_pt:"Estudo de neuroimagem com 36 participantes. Meditadores experientes (>500h) mostraram maior ativação do córtex pré-frontal ventromedial e menor reatividade da amígdala a estímulos emocionais negativos.", evidence_reason:"Evidência mecanicista de neuroimagem; não prova eficácia clínica isoladamente.", abnt:"HÖLZEL, B. K. et al. Neural correlates of mindfulness meditation. NeuroImage, v. 210, 2020." },
    ],
    synthesis: { direct_answer:"Com base em 19 estudos analisados, a meditação mindfulness (especialmente MBSR e MBCT) reduz sintomas de ansiedade com magnitude de efeito moderada. Os resultados são consistentes em diferentes populações e se mantêm em follow-up de até 12 meses.", consensus_agree:74, consensus_inconclusive:19, consensus_contradict:7, confidence_level:"alta", confidence_score:4, confidence_reasons:["Meta-análise de alta qualidade com 39 estudos","RCTs com grupos controle ativos"], inconclusive_summary:"A dose mínima eficaz (número de horas de prática) e o melhor formato (presencial vs. app) ainda não estão definidos.", contradict_explanation:"Estudos com controle ativo (TCC, psicoeducação) mostram vantagem menor do mindfulness do que estudos com lista de espera.", practical_insight:"MBSR de 8 semanas (2,5h/semana + prática diária de 45min) é o protocolo com maior evidência. Apps de mindfulness guiado mostraram efeito menor, mas ainda significativo.", search_tip:"" },
  },
  {
    keywords: ["probiótico","intestinal","gut","microbioma","microbiome","flora"],
    count: 16,
    articles: [
      { title:"Probiotics for gastrointestinal disorders: a systematic review and meta-analysis", authors:"Ford, A. C., Quigley, E. M., Lacy, B. E.", year:"2022", journal:"Gut", source:"PubMed", citations:1567, is_oa:false, doi:"10.1136/gutjnl-2021-325090", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Meta-análise de 53 ECRs avaliando probióticos em SII, diarreia associada a antibióticos e colite. Probióticos multiestirpe reduziram significativamente sintomas de SII (RR=0,79) e risco de diarreia por antibióticos (RR=0,58).", evidence_reason:"Meta-análise com grande número de ECRs, análise de heterogeneidade robusta.", abnt:"FORD, A. C. et al. Probiotics for gastrointestinal disorders. Gut, v. 71, n. 6, p. 1147-1157, 2022." },
      { title:"Effect of Lactobacillus acidophilus supplementation on gut microbiota diversity", authors:"Sanders, M. E., Merenstein, D. J., Reid, G.", year:"2021", journal:"Nature Reviews Gastroenterology", source:"Semantic Scholar", citations:892, is_oa:false, doi:"10.1038/s41575-021-00461-7", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"ECR com 184 adultos saudáveis. Suplementação com L. acidophilus NCFM por 12 semanas aumentou diversidade alfa do microbioma (p=0,02) e reduziu marcadores inflamatórios intestinais, sem efeitos adversos graves.", evidence_reason:"RCT com desfechos objetivos de microbioma e marcadores inflamatórios.", abnt:"SANDERS, M. E. et al. Effect of Lactobacillus acidophilus supplementation. Nature Reviews Gastroenterology, v. 18, p. 596-610, 2021." },
      { title:"Probiotics, gut microbiota and health: a narrative review", authors:"Gareau, M. G., Sherman, P. M., Walker, W. A.", year:"2020", journal:"Gastroenterologia y Hepatologia", source:"SciELO", citations:434, is_oa:true, doi:"10.1016/j.gastrohep.2020.05.009", evidence_score:2, study_type:"revisão narrativa", expert_reviewed:true, source_quality:"média", potential_bias:"Revisão narrativa sem metodologia sistemática de busca.", abstract_pt:"Revisão abrangente dos mecanismos pelos quais probióticos modulam a microbiota intestinal, incluindo competição com patógenos, produção de SCFAs e modulação da resposta imune da mucosa.", evidence_reason:"Boa cobertura mecanicista, mas sem análise estatística própria e seleção subjetiva.", abnt:"GAREAU, M. G.; SHERMAN, P. M.; WALKER, W. A. Probiotics, gut microbiota and health. Gastroenterologia y Hepatologia, v. 43, n. 6, 2020." },
    ],
    synthesis: { direct_answer:"Com base em 16 estudos analisados, probióticos demonstram benefícios consistentes em condições gastrointestinais específicas — principalmente diarreia associada a antibióticos e síndrome do intestino irritável. A evidência de benefício em indivíduos saudáveis é mais fraca.", consensus_agree:68, consensus_inconclusive:24, consensus_contradict:8, confidence_level:"média", confidence_score:3, confidence_reasons:["Meta-análise de alta qualidade disponível para condições específicas","Mecanismos biológicos bem documentados"], inconclusive_summary:"O efeito varia muito entre cepas, doses e condições clínicas. A extrapolação de benefícios de uma cepa para outra não é cientificamente suportada.", contradict_explanation:"Estudos em populações saudáveis frequentemente não encontram melhora clínica significativa além do placebo.", practical_insight:"Lactobacillus rhamnosus GG e Saccharomyces boulardii têm a maior base de evidências para prevenção de diarreia por antibióticos. Para SII, combinações multiestirpe mostraram maior eficácia.", search_tip:"" },
  },
  {
    keywords: ["saúde única","one health","zoonose","saúde animal","saúde ambiental","saúde pública"],
    count: 31,
    broad: true,
    articles: [
      { title:"One Health approach: integrating human, animal and environmental health surveillance", authors:"Zinsstag, J., Schelling, E., Waltner-Toews, D.", year:"2023", journal:"The Lancet", source:"PubMed", citations:2103, is_oa:false, doi:"10.1016/S0140-6736(22)02585-2", evidence_score:4, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão sistemática de iniciativas One Health em 47 países. A abordagem integrada reduziu custos de vigilância epidemiológica em 22% e detectou surtos zoonóticos em média 18 dias antes das abordagens compartimentadas tradicionais.", evidence_reason:"Revisão sistemática com escopo global e dados comparativos robustos.", abnt:"ZINSSTAG, J. et al. One Health approach. The Lancet, v. 401, p. 1154-1165, 2023." },
      { title:"Antimicrobial resistance and One Health: a systematic review of integrated surveillance studies", authors:"Robinson, T. P., Bu, D. P., Carrique-Mas, J.", year:"2022", journal:"Nature Medicine", source:"Semantic Scholar", citations:1456, is_oa:true, doi:"10.1038/s41591-022-01808-0", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Meta-análise de 89 estudos de vigilância integrada de resistência antimicrobiana em interfaces humano-animal-ambiente. Mostra que 62% das resistências em humanos têm origem em reservatórios animais ou ambientais.", evidence_reason:"Meta-análise de alta qualidade com dado de atribuição de resistência antimicrobiana.", abnt:"ROBINSON, T. P. et al. Antimicrobial resistance and One Health. Nature Medicine, v. 28, p. 1231-1245, 2022." },
      { title:"Climate change, land use and emerging zoonoses: a One Health perspective", authors:"Jones, K. E., Patel, N. G., Levy, M. A.", year:"2021", journal:"Science", source:"OpenAlex", citations:987, is_oa:false, doi:"10.1126/science.aab3564", evidence_score:3, study_type:"estudo observacional", expert_reviewed:true, source_quality:"alta", potential_bias:"Dificuldade de estabelecer causalidade entre mudanças ambientais e emergência de doenças.", abstract_pt:"Análise de 335 surtos de doenças emergentes entre 1940 e 2020. Zoonoses representam 60,3% e sua frequência aumentou significativamente com o desmatamento tropical e intensificação agropecuária.", evidence_reason:"Grande base de dados histórica, mas causalidade direta limitada pela natureza observacional.", abnt:"JONES, K. E. et al. Climate change and emerging zoonoses. Science, v. 374, p. 886-892, 2021." },
    ],
    synthesis: { direct_answer:"Saúde Única (One Health) é um campo de pesquisa transdisciplinar que reconhece a interdependência entre saúde humana, animal e ambiental. A literatura aborda vigilância integrada de zoonoses, resistência antimicrobiana em interfaces multi-espécies, impacto de mudanças climáticas em doenças emergentes e modelos de governança colaborativa entre setores de saúde.", consensus_agree:0, consensus_inconclusive:100, consensus_contradict:0, confidence_level:"alta", confidence_score:4, confidence_reasons:["A vigilância integrada detecta surtos até 18 dias antes de abordagens isoladas","62% das resistências antimicrobianas humanas têm origem em reservatórios animais/ambientais","O campo é consensualmente aceito por OMS, FAO e OIE como abordagem prioritária"], inconclusive_summary:"Saúde Única é um tema amplo — não existe uma única hipótese central a confirmar ou refutar. Os estudos abordam múltiplas subáreas com diferentes desfechos e populações.", contradict_explanation:"", practical_insight:"Para pesquisas acadêmicas, refine a busca com uma subárea específica: 'resistência antimicrobiana One Health', 'vigilância zoonoses integrada' ou 'impacto ambiental saúde pública'.", search_tip:"Tente: 'zoonoses e mudanças climáticas', 'resistência antimicrobiana animal humano', ou 'vigilância epidemiológica integrada saúde pública'" },
  },
];

export type QueryType = "hypothesis" | "broad" | "comparison";

export const classifyQuery = (q: string): QueryType => {
  const ql = q.toLowerCase().trim();
  if (/vs\.?|versus|ou.{1,20}ou|comparad|melhor.*pior|pior.*melhor/.test(ql)) return "comparison";
  const causalWords = /reduz|aumenta|melhora|causa|previne|trata|afeta|impacta|associa|relaciona|diminui|eleva|piora|beneficia|prejudica|influencia|provoca|leva a|resulta|gera|favorece|protege|ajuda/i;
  const questionWords = /\?|será que|é verdade|funciona|eficaz|efetivo/i;
  if (causalWords.test(ql) || (questionWords.test(ql) && ql.split(" ").length > 3)) return "hypothesis";
  return "broad";
};

export const findMatch = (query: string): MockEntry => {
  const ql = query.toLowerCase();
  const match = MOCK_DB.find((m) => m.keywords.some((k) => ql.includes(k.toLowerCase())));
  if (match) return match;
  
  // Fallback genérico
  return {
    count: Math.floor(8 + Math.random() * 12),
    keywords: [],
    articles: [
      { title:`Systematic review on: ${query}`, authors:"Silva, M. A., Santos, R. C., Oliveira, J. P.", year:"2023", journal:"Brazilian Journal of Medical Research", source:"SciELO", citations:234, is_oa:true, doi:"10.1590/s0100-40422023000100001", evidence_score:4, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:`Revisão sistemática de 14 estudos sobre "${query}". Os resultados indicam evidência moderada a forte para o desfecho primário investigado, com consistência entre estudos de diferentes países e populações.`, evidence_reason:"Revisão sistemática com protocolo PRISMA registrado.", abnt:`SILVA, M. A. et al. Systematic review on ${query}. Brazilian Journal of Medical Research, v. 56, n. 1, 2023.` },
      { title:`Randomized controlled trial investigating ${query}`, authors:"Johnson, T. R., Williams, K. M., Thompson, A.", year:"2022", journal:"Journal of Clinical Research", source:"PubMed", citations:156, is_oa:false, doi:"10.1016/j.jcr.2022.08.012", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Amostra de conveniência; pode limitar generalização.", abstract_pt:`Ensaio clínico randomizado com 180 participantes avaliando a intervenção referente a "${query}". O grupo intervenção apresentou melhora significativa no desfecho primário (p=0,008) após 16 semanas de seguimento.`, evidence_reason:"RCT com grupo controle ativo e desfecho pré-registrado.", abnt:`JOHNSON, T. R. et al. Randomized controlled trial on ${query}. Journal of Clinical Research, v. 34, p. 112-124, 2022.` },
      { title:`Observational study on long-term outcomes of ${query}`, authors:"Chen, L., Rodriguez, M., Patel, S.", year:"2021", journal:"European Journal of Public Health", source:"OpenAlex", citations:89, is_oa:true, doi:"10.1093/eurpub/ckab001", evidence_score:3, study_type:"coorte", expert_reviewed:true, source_quality:"média", potential_bias:"Estudo observacional; não exclui confundidores residuais.", abstract_pt:`Estudo de coorte prospectivo com 2.847 participantes acompanhados por 5 anos investigando "${query}". Associação significativa observada após ajuste para covariáveis demográficas e clínicas.`, evidence_reason:"Coorte prospectiva com tamanho amostral adequado, mas não prova causalidade.", abnt:`CHEN, L. et al. Observational study on ${query}. European Journal of Public Health, v. 31, n. 3, p. 445-452, 2021.` },
    ],
    synthesis: { direct_answer:`Com base nos estudos analisados sobre "${query}", a literatura científica apresenta evidências de qualidade moderada a alta. Os resultados são consistentes entre diferentes populações, mas o tamanho do efeito varia entre os estudos.`, consensus_agree:65, consensus_inconclusive:25, consensus_contradict:10, confidence_level:"média", confidence_score:3, confidence_reasons:["Estudos de qualidade moderada disponíveis","Resultados relativamente consistentes"], inconclusive_summary:"A magnitude do efeito e os subgrupos que mais se beneficiam ainda precisam de mais estudos.", contradict_explanation:"Alguns estudos com desenhos metodológicos mais rígidos mostram efeitos menores.", practical_insight:"Os estudos disponíveis sugerem benefício, mas recomenda-se consultar um especialista para aplicação clínica individualizada.", search_tip:"Tente refinar a busca adicionando uma população específica (ex: adultos, idosos) ou desfecho (ex: qualidade de vida, marcadores laboratoriais)." },
  };
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

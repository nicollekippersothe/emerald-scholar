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
  study_recortes?: string[];
  maturity_label?: string;
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
    count: 24,
    articles: [
      { title:"Exercise as a treatment for depression: A meta-analysis", authors:"Blumenthal, J. A., Babyak, M. A., Moore, K. A.", year:"2023", journal:"JAMA Psychiatry", source:"PubMed", citations:2847, is_oa:true, doi:"10.1001/jamapsychiatry.2023.1234", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Esta meta-análise avaliou 45 ensaios clínicos randomizados com 3.247 participantes. O exercício aeróbico de intensidade moderada mostrou redução significativa nos sintomas depressivos (p<0,001), com efeito comparável aos antidepressivos.", evidence_reason:"Meta-análise com 45 ECRs, amostras grandes e baixo risco de viés.", abnt:"BLUMENTHAL, J. A.; BABYAK, M. A.; MOORE, K. A. Exercise as a treatment for depression. JAMA Psychiatry, v. 80, n. 4, p. 388-397, 2023." },
      { title:"Aerobic exercise and depressive symptoms: A systematic review of randomized trials", authors:"Kvam, S., Kleppe, C. L., Nordhus, I. H.", year:"2022", journal:"Journal of Affective Disorders", source:"Semantic Scholar", citations:1203, is_oa:false, doi:"10.1016/j.jad.2022.05.040", evidence_score:5, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão sistemática de 23 ECRs avaliando exercício aeróbico em adultos com depressão maior. Os resultados indicam que exercício aeróbico de 3x/semana por 8 semanas reduz sintomas depressivos em 47% dos participantes.", evidence_reason:"Revisão sistemática rigorosa com protocolo PRISMA.", abnt:"KVAM, S.; KLEPPE, C. L.; NORDHUS, I. H. Aerobic exercise and depressive symptoms. Journal of Affective Disorders, v. 307, p. 234-241, 2022." },
      { title:"Physical activity and depression in older adults: cohort study", authors:"Harvey, S. B., Overland, S., Hatch, S. L.", year:"2021", journal:"American Journal of Psychiatry", source:"OpenAlex", citations:876, is_oa:true, doi:"10.1176/appi.ajp.2021.20101559", evidence_score:3, study_type:"coorte", expert_reviewed:true, source_quality:"alta", potential_bias:"Possível viés de causalidade reversa: depressão pode reduzir atividade física.", abstract_pt:"Estudo de coorte com 33.908 adultos acompanhados por 11 anos. Participantes com atividade física regular tiveram 44% menos risco de desenvolver depressão, independente de outros fatores de risco.", evidence_reason:"Coorte grande e longa, mas não prova causalidade direta.", abnt:"HARVEY, S. B.; OVERLAND, S.; HATCH, S. L. Physical activity and depression in older adults. American Journal of Psychiatry, v. 178, n. 10, p. 946-956, 2021." },
      { title:"Exercise interventions for depression: a European perspective from institutional repositories", authors:"Müller, F., Berger, T., Schmidt, R.", year:"2022", journal:"European Journal of Sport Science", source:"BASE", citations:312, is_oa:true, doi:"10.1080/17461391.2022.2045678", evidence_score:4, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão sistemática de 19 estudos europeus indexados em repositórios institucionais. Confirma que exercício aeróbico de intensidade moderada reduz sintomas depressivos (d=0,56) com heterogeneidade baixa entre populações europeias.", evidence_reason:"Revisão sistemática com foco em repositórios institucionais europeus, dados complementares às bases tradicionais.", abnt:"MÜLLER, F.; BERGER, T.; SCHMIDT, R. Exercise interventions for depression: a European perspective. European Journal of Sport Science, v. 22, n. 8, p. 1145-1158, 2022." },
      { title:"Full-text analysis of exercise and mental health RCTs from open repositories", authors:"Chen, W., Park, S., Lee, J.", year:"2023", journal:"CORE Open Research Digest", source:"CORE", citations:89, is_oa:true, doi:"10.5281/zenodo.7654321", evidence_score:3, study_type:"revisão narrativa", expert_reviewed:false, source_quality:"média", potential_bias:"Inclui preprints não revisados por pares.", abstract_pt:"Análise de texto completo de 67 artigos em acesso aberto sobre exercício e saúde mental. Identifica que a maioria dos ECRs positivos usa exercício aeróbico supervisionado, enquanto estudos com exercício autônomo mostram resultados mais variáveis.", evidence_reason:"Agregação ampla de acesso aberto, mas inclui preprints e sem revisão por pares sistemática.", abnt:"CHEN, W.; PARK, S.; LEE, J. Full-text analysis of exercise and mental health RCTs. CORE Open Research Digest, 2023." },
    ],
    synthesis: {
      direct_answer:"Com base em 24 estudos analisados, o exercício aeróbico reduz significativamente os sintomas da depressão clínica, com eficácia comparável aos antidepressivos em casos leves a moderados. A evidência é consistente em diferentes populações e durações de intervenção.",
      consensus_agree:78, consensus_inconclusive:15, consensus_contradict:7,
      confidence_level:"alta", confidence_score:4,
      confidence_reasons:["Três meta-análises de alta qualidade concordam","ECRs com amostras representativas","Dados confirmados por repositórios institucionais europeus (BASE)"],
      inconclusive_summary:"Não está claro qual modalidade ou intensidade de exercício é mais eficaz.",
      contradict_explanation:"7% dos estudos em pacientes com depressão grave não encontraram diferença significativa em relação ao placebo.",
      practical_insight:"Para adultos com depressão leve a moderada, 30 min de exercício aeróbico 3x/semana já mostram benefícios mensuráveis em 4-8 semanas.",
      search_tip:"Busque por 'modalidade do exercício e saúde mental'.",
      study_recortes:[
        "Blumenthal et al. (2023) foca no efeito comparativo exercício vs. antidepressivos — abordagem farmacológica.",
        "Kvam et al. (2022) analisa a frequência e duração ideais — abordagem de dose-resposta.",
        "Harvey et al. (2021) investiga causalidade de longo prazo via coorte — abordagem epidemiológica, sem intervenção direta.",
        "Müller et al. (2022, via BASE) confirma resultados em populações europeias — validação transcultural.",
      ],
      maturity_label:"Consenso consolidado",
    },
  },
  {
    keywords: ["retinol","linhas finas","rugas","envelhecimento","pele","skin","aging"],
    count: 28,
    articles: [
      { title:"Retinoids in the treatment of skin aging: an overview of clinical efficacy and safety", authors:"Kafi, R., Kwak, H. S. R., Schumaker, W. E.", year:"2022", journal:"Clinical Interventions in Aging", source:"PubMed", citations:1843, is_oa:true, doi:"10.2147/CIA.S24600", evidence_score:5, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão sistemática de 31 ECRs demonstrando que retinol 0,1% a 1% aplicado topicamente reduz significativamente linhas finas, hiperpigmentação e perda de elasticidade após 12 semanas de uso contínuo.", evidence_reason:"Revisão sistemática com meta-análise de 31 ECRs, alta consistência entre os estudos.", abnt:"KAFI, R. et al. Retinoids in the treatment of skin aging. Clinical Interventions in Aging, v. 17, p. 1201-1212, 2022." },
      { title:"Randomized controlled trial of topical retinol versus placebo for facial aging in adults over 40", authors:"Mukherjee, S., Date, A., Patravale, V.", year:"2021", journal:"Journal of Dermatological Science", source:"Semantic Scholar", citations:934, is_oa:false, doi:"10.1016/j.jdermsci.2021.03.008", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Financiado pelo fabricante; risco de viés moderado.", abstract_pt:"ECR duplo-cego com 240 participantes usando retinol 0,5% vs. placebo por 24 semanas. O grupo retinol apresentou redução de 32% nas linhas periorbitais (p=0,003) e melhora de 28% na firmeza da pele.", evidence_reason:"RCT duplo-cego com tamanho amostral adequado e desfechos objetivos.", abnt:"MUKHERJEE, S.; DATE, A.; PATRAVALE, V. Randomized controlled trial of topical retinol. Journal of Dermatological Science, v. 62, p. 183-191, 2021." },
      { title:"Mechanism of action of retinol and retinoic acid in skin photoaging: collagen synthesis pathway", authors:"Zouboulis, C. C., Makrantonaki, E.", year:"2020", journal:"Dermato-Endocrinology", source:"OpenAlex", citations:512, is_oa:true, doi:"10.4161/derm.26499", evidence_score:2, study_type:"revisão narrativa", expert_reviewed:true, source_quality:"média", potential_bias:"Revisão não sistemática — seleção subjetiva dos estudos.", abstract_pt:"Revisão dos mecanismos moleculares pelo qual retinol estimula síntese de colágeno tipo I e III via receptores RAR/RXR, inibindo metaloproteases e revertendo danos por fotoenvelhecimento.", evidence_reason:"Revisão narrativa com boa cobertura mecanicista, mas sem análise estatística própria.", abnt:"ZOUBOULIS, C. C.; MAKRANTONAKI, E. Mechanism of action of retinol in skin photoaging. Dermato-Endocrinology, v. 12, n. 1, 2020." },
      { title:"Retinol formulations and patent landscape for anti-aging cosmetics", authors:"Park, J., Kim, H., Yoon, S.", year:"2023", journal:"Journal of Cosmetic Science Patents", source:"Lens.org", citations:67, is_oa:false, doi:"10.1016/j.jcsp.2023.04.012", evidence_score:2, study_type:"revisão narrativa", expert_reviewed:true, source_quality:"média", potential_bias:"Revisão de patentes — viés para aplicações comerciais.", abstract_pt:"Análise de 142 patentes registradas entre 2015-2023 relacionadas a formulações de retinol para uso cosmético anti-aging. Identificou tendência crescente em encapsulamento lipossômico para reduzir irritação e melhorar estabilidade.", evidence_reason:"Cruzamento patentes-literatura útil para contexto de inovação, mas não avalia eficácia clínica.", abnt:"PARK, J.; KIM, H.; YOON, S. Retinol formulations and patent landscape. Journal of Cosmetic Science Patents, v. 8, n. 2, 2023." },
      { title:"Retinol and skin aging: evidence from European biomedical archives", authors:"Schmidt, A., Bauer, K.", year:"2022", journal:"European PMC Research Reports", source:"Europe PMC", citations:198, is_oa:true, doi:"10.1093/europepmc/pmc.2022.3456", evidence_score:4, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão de 24 estudos disponíveis em texto completo via Europe PMC. Confirma eficácia do retinol tópico em redução de linhas finas (SMD = -0,48; IC95% -0,62 a -0,34) com perfil de segurança aceitável em concentrações ≤ 1%.", evidence_reason:"Revisão com acesso a textos completos permitindo avaliação mais profunda da qualidade metodológica.", abnt:"SCHMIDT, A.; BAUER, K. Retinol and skin aging: evidence from European biomedical archives. Europe PMC Research Reports, 2022." },
    ],
    synthesis: {
      direct_answer:"Com base em 28 estudos analisados, o retinol tópico (0,1%–1%) reduz linhas finas e melhora a textura da pele de forma estatisticamente significativa em adultos. O efeito é dose-dependente e requer uso contínuo de 12 a 24 semanas para resultados clinicamente relevantes.",
      consensus_agree:82, consensus_inconclusive:12, consensus_contradict:6,
      confidence_level:"alta", confidence_score:4,
      confidence_reasons:["Múltiplos ECRs duplo-cego de alta qualidade","Revisão sistemática com meta-análise disponível","Dados de Europe PMC com acesso a textos completos reforçam a análise"],
      inconclusive_summary:"A concentração ideal e o protocolo de aplicação (frequência, associação com outros ativos) ainda variam entre estudos.",
      contradict_explanation:"Alguns estudos não encontraram diferença significativa em fototipos mais escuros (Fitzpatrick IV-VI).",
      practical_insight:"Retinol 0,3%–0,5% à noite, com fotoproteção diária, é o protocolo com melhor relação eficácia/tolerabilidade documentado em estudos.",
      search_tip:"Busque por 'retinol e fotoproteção diária'.",
      study_recortes:[
        "Kafi et al. (2022) foca na eficácia clínica geral — abordagem de desfecho clínico.",
        "Mukherjee et al. (2021) investiga dose específica (0,5%) em população >40 anos — abordagem de dose-resposta por faixa etária.",
        "Zouboulis & Makrantonaki (2020) detalha o mecanismo molecular (RAR/RXR e colágeno) — abordagem mecanicista.",
        "Park et al. (2023, via Lens.org) cruza dados de patentes com literatura — abordagem de inovação tecnológica.",
      ],
      maturity_label:"Consenso consolidado",
    },
  },
  {
    keywords: ["sono","fragmentado","alzheimer","sleep","memória","memory","demência"],
    count: 19,
    articles: [
      { title:"Sleep fragmentation and risk of Alzheimer's disease: a prospective cohort study", authors:"Lucey, B. P., Hicks, T. J., McLeland, J. S.", year:"2023", journal:"Nature Medicine", source:"PubMed", citations:1102, is_oa:false, doi:"10.1038/s41591-023-02211-7", evidence_score:3, study_type:"coorte", expert_reviewed:true, source_quality:"alta", potential_bias:"Possível causalidade reversa — Alzheimer pré-clínico pode causar fragmentação do sono.", abstract_pt:"Estudo de coorte prospectivo com 4.417 adultos acompanhados por 8 anos. Participantes com fragmentação severa do sono tiveram 1,68× mais risco de desenvolver Alzheimer (HR=1,68; IC95% 1,23-2,29), independentemente de APOE-ε4.", evidence_reason:"Coorte prospectiva longa com controle de múltiplos confundidores, mas não prova causalidade.", abnt:"LUCEY, B. P. et al. Sleep fragmentation and risk of Alzheimer's disease. Nature Medicine, v. 29, p. 445-454, 2023." },
      { title:"Slow-wave sleep disruption increases cerebrospinal fluid amyloid-β levels", authors:"Ju, Y. E., McLeland, J. S., Toedebusch, C. D.", year:"2021", journal:"Brain", source:"Semantic Scholar", citations:876, is_oa:true, doi:"10.1093/brain/awu052", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"ECR cruzado com 20 participantes saudáveis. A interrupção experimental do sono de ondas lentas por uma única noite elevou os níveis de β-amiloide no LCR em 10% (p=0,03), sugerindo que o sono profundo limpa resíduos neurotóxicos.", evidence_reason:"RCT experimental com medida direta de biomarcador de Alzheimer; amostra pequena.", abnt:"JU, Y. E. et al. Slow-wave sleep disruption increases cerebrospinal fluid amyloid-β. Brain, v. 137, n. 10, p. 2806-2815, 2021." },
      { title:"Systematic review of sleep disturbances and dementia risk", authors:"Bubu, O. M., Brannick, M., Mortimer, J.", year:"2022", journal:"Sleep", source:"OpenAlex", citations:743, is_oa:false, doi:"10.5665/sleep.6390", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Meta-análise de 27 estudos prospectivos (69.216 participantes). Distúrbios do sono estão associados a risco 1,55× maior de demência geral e 1,65× de Alzheimer especificamente. A associação persiste após ajuste para depressão e comorbidades.", evidence_reason:"Meta-análise com grande N amostral e análise de heterogeneidade rigorosa.", abnt:"BUBU, O. M. et al. Systematic review of sleep disturbances and dementia risk. Sleep, v. 40, n. 1, 2022." },
      { title:"Sleep and neurodegeneration: full-text mining of open access repositories", authors:"Rivera, M., Costa, A., Fernández, L.", year:"2023", journal:"CORE Neuroscience Digest", source:"CORE", citations:45, is_oa:true, doi:"10.5281/zenodo.8901234", evidence_score:3, study_type:"revisão narrativa", expert_reviewed:false, source_quality:"média", potential_bias:"Inclui preprints; seleção não sistemática.", abstract_pt:"Mineração de texto completo de 89 artigos em acesso aberto sobre sono e neurodegeneração. Identificou que a maioria dos estudos prospectivos usa actigrafia, enquanto poucos utilizam polissonografia, o que pode superestimar a fragmentação do sono.", evidence_reason:"Análise ampla de acesso aberto que identifica viés metodológico importante nos estudos disponíveis.", abnt:"RIVERA, M.; COSTA, A.; FERNÁNDEZ, L. Sleep and neurodegeneration: full-text mining. CORE Neuroscience Digest, 2023." },
      { title:"Sleep biomarkers and Alzheimer risk: doctoral thesis from University of Munich", authors:"Weber, H.", year:"2022", journal:"LMU Munich Repository", source:"BASE", citations:23, is_oa:true, doi:"10.5282/edoc.29876", evidence_score:3, study_type:"coorte", expert_reviewed:true, source_quality:"média", potential_bias:"Tese doutoral com amostra regional limitada.", abstract_pt:"Tese doutoral analisando biomarcadores de sono em 312 adultos de Munique. Confirmou associação entre fragmentação do sono e níveis elevados de tau fosforilada no plasma (r=0,34, p=0,002), sugerindo que a relação sono-Alzheimer envolve múltiplos biomarcadores.", evidence_reason:"Tese doutoral aprovada por banca, mas com amostra regional e dados não publicados em periódico indexado.", abnt:"WEBER, H. Sleep biomarkers and Alzheimer risk. 2022. Tese (Doutorado) — Ludwig-Maximilians-Universität München, 2022." },
    ],
    synthesis: {
      direct_answer:"Com base em 19 estudos analisados, a fragmentação do sono está consistentemente associada ao aumento do risco de Alzheimer. A evidência sugere um mecanismo causal via acúmulo de β-amiloide durante o sono interrompido, embora causalidade reversa não possa ser completamente excluída.",
      consensus_agree:71, consensus_inconclusive:22, consensus_contradict:7,
      confidence_level:"média", confidence_score:3,
      confidence_reasons:["Meta-análise de alta qualidade disponível","Mecanismo biológico plausível documentado em RCT","Teses doutorais (BASE) confirmam associação com biomarcadores adicionais"],
      inconclusive_summary:"Não está claro se a relação é causal ou se o Alzheimer pré-clínico causa fragmentação do sono (causalidade reversa).",
      contradict_explanation:"Estudos com medidas objetivas do sono (polissonografia) mostram associações mais fracas do que os que usam questionários de autorrelato.",
      practical_insight:"Manter 7-9h de sono consolidado, especialmente o sono de ondas lentas, pode ser uma estratégia preventiva de baixo custo e baixo risco.",
      search_tip:"Busque por 'sono de ondas lentas e Alzheimer'.",
      study_recortes:[
        "Lucey et al. (2023) investiga associação epidemiológica em coorte grande — abordagem de risco populacional.",
        "Ju et al. (2021) testa o mecanismo causal via intervenção experimental (interrupção de sono) — abordagem mecanicista.",
        "Bubu et al. (2022) consolida evidência meta-analítica de 27 estudos — abordagem de síntese quantitativa.",
        "Weber (2022, via BASE) explora biomarcadores adicionais (tau fosforilada) em tese doutoral — abordagem de biomarcadores.",
      ],
      maturity_label:"Debate ativo",
    },
  },
  {
    keywords: ["mindfulness","meditação","ansiedade","meditation","anxiety","estresse","stress"],
    count: 23,
    articles: [
      { title:"Mindfulness-based stress reduction and anxiety: a meta-analysis", authors:"Hofmann, S. G., Sawyer, A. T., Witt, A. A.", year:"2022", journal:"Journal of Consulting and Clinical Psychology", source:"PubMed", citations:2341, is_oa:false, doi:"10.1037/a0018555", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Meta-análise de 39 estudos (1.140 participantes) avaliando MBSR e MBCT. Efeito moderado-grande na redução de ansiedade (d=0,63) e depressão (d=0,59), com manutenção do efeito em follow-up de até 12 meses.", evidence_reason:"Meta-análise rigorosa com análise de heterogeneidade e viés de publicação.", abnt:"HOFMANN, S. G.; SAWYER, A. T.; WITT, A. A. Mindfulness-based stress reduction and anxiety. Journal of Consulting and Clinical Psychology, v. 78, n. 2, p. 169-183, 2022." },
      { title:"Randomized trial of mindfulness meditation for generalized anxiety disorder", authors:"Hoge, E. A., Bui, E., Marques, L.", year:"2021", journal:"JAMA Psychiatry", source:"Semantic Scholar", citations:987, is_oa:true, doi:"10.1001/jamapsychiatry.2021.1183", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"ECR comparando MBSR com psicoeducação sobre estresse em 276 adultos com TAG. O grupo MBSR apresentou redução superior nos sintomas de ansiedade (HAM-A) na semana 8 (d=0,41, p<0,001).", evidence_reason:"RCT com grupo controle ativo e desfecho primário pré-registrado.", abnt:"HOGE, E. A. et al. Randomized trial of mindfulness meditation for anxiety. JAMA Psychiatry, v. 78, n. 8, p. 844-853, 2021." },
      { title:"Neural correlates of mindfulness meditation: prefrontal cortex and amygdala reactivity", authors:"Hölzel, B. K., Carmody, J., Vangel, M.", year:"2020", journal:"NeuroImage", source:"OpenAlex", citations:623, is_oa:false, doi:"10.4161/derm.26499", evidence_score:3, study_type:"estudo observacional", expert_reviewed:true, source_quality:"alta", potential_bias:"Amostra de conveniência; praticantes experientes vs. iniciantes.", abstract_pt:"Estudo de neuroimagem com 36 participantes. Meditadores experientes (>500h) mostraram maior ativação do córtex pré-frontal ventromedial e menor reatividade da amígdala a estímulos emocionais negativos.", evidence_reason:"Evidência mecanicista de neuroimagem; não prova eficácia clínica isoladamente.", abnt:"HÖLZEL, B. K. et al. Neural correlates of mindfulness meditation. NeuroImage, v. 210, 2020." },
      { title:"Mindfulness interventions in European university populations: a cross-repository analysis", authors:"Lindström, E., Johansson, P.", year:"2023", journal:"Europe PMC Mental Health Reports", source:"Europe PMC", citations:112, is_oa:true, doi:"10.1093/europepmc/pmc.2023.7890", evidence_score:3, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Foco em populações universitárias; generalização limitada.", abstract_pt:"Revisão de 15 estudos europeus disponíveis em texto completo via Europe PMC. Mindfulness em universitários reduziu ansiedade (d=0,52) e burnout acadêmico (d=0,38), mas a adesão ao protocolo completo foi inferior a 60%.", evidence_reason:"Revisão com acesso a textos completos permitindo avaliação da adesão — métrica raramente reportada.", abnt:"LINDSTRÖM, E.; JOHANSSON, P. Mindfulness in European university populations. Europe PMC Mental Health Reports, 2023." },
    ],
    synthesis: {
      direct_answer:"Com base em 23 estudos analisados, a meditação mindfulness (especialmente MBSR e MBCT) reduz sintomas de ansiedade com magnitude de efeito moderada. Os resultados são consistentes em diferentes populações e se mantêm em follow-up de até 12 meses.",
      consensus_agree:74, consensus_inconclusive:19, consensus_contradict:7,
      confidence_level:"alta", confidence_score:4,
      confidence_reasons:["Meta-análise de alta qualidade com 39 estudos","RCTs com grupos controle ativos","Dados de Europe PMC revelam desafio de adesão pouco documentado"],
      inconclusive_summary:"A dose mínima eficaz (número de horas de prática) e o melhor formato (presencial vs. app) ainda não estão definidos.",
      contradict_explanation:"Estudos com controle ativo (TCC, psicoeducação) mostram vantagem menor do mindfulness do que estudos com lista de espera.",
      practical_insight:"MBSR de 8 semanas (2,5h/semana + prática diária de 45min) é o protocolo com maior evidência. Apps de mindfulness guiado mostraram efeito menor, mas ainda significativo.",
      search_tip:"Refine para 'formato presencial vs app'.",
      study_recortes:[
        "Hofmann et al. (2022) consolida a evidência meta-analítica geral — abordagem de síntese quantitativa.",
        "Hoge et al. (2021) compara mindfulness com controle ativo (psicoeducação) — abordagem de eficácia comparativa.",
        "Hölzel et al. (2020) investiga os correlatos neurais (amígdala, córtex pré-frontal) — abordagem mecanicista.",
        "Lindström & Johansson (2023, via Europe PMC) revela que a adesão ao protocolo é um problema crítico pouco reportado — abordagem de implementação.",
      ],
      maturity_label:"Consenso consolidado",
    },
  },
  {
    keywords: ["probiótico","intestinal","gut","microbioma","microbiome","flora"],
    count: 21,
    articles: [
      { title:"Probiotics for gastrointestinal disorders: a systematic review and meta-analysis", authors:"Ford, A. C., Quigley, E. M., Lacy, B. E.", year:"2022", journal:"Gut", source:"PubMed", citations:1567, is_oa:false, doi:"10.1136/gutjnl-2021-325090", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Meta-análise de 53 ECRs avaliando probióticos em SII, diarreia associada a antibióticos e colite. Probióticos multiestirpe reduziram significativamente sintomas de SII (RR=0,79) e risco de diarreia por antibióticos (RR=0,58).", evidence_reason:"Meta-análise com grande número de ECRs, análise de heterogeneidade robusta.", abnt:"FORD, A. C. et al. Probiotics for gastrointestinal disorders. Gut, v. 71, n. 6, p. 1147-1157, 2022." },
      { title:"Effect of Lactobacillus acidophilus supplementation on gut microbiota diversity", authors:"Sanders, M. E., Merenstein, D. J., Reid, G.", year:"2021", journal:"Nature Reviews Gastroenterology", source:"Semantic Scholar", citations:892, is_oa:false, doi:"10.1038/s41575-021-00461-7", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"ECR com 184 adultos saudáveis. Suplementação com L. acidophilus NCFM por 12 semanas aumentou diversidade alfa do microbioma (p=0,02) e reduziu marcadores inflamatórios intestinais, sem efeitos adversos graves.", evidence_reason:"RCT com desfechos objetivos de microbioma e marcadores inflamatórios.", abnt:"SANDERS, M. E. et al. Effect of Lactobacillus acidophilus supplementation. Nature Reviews Gastroenterology, v. 18, p. 596-610, 2021." },
      { title:"Probiotics, gut microbiota and health: a narrative review", authors:"Gareau, M. G., Sherman, P. M., Walker, W. A.", year:"2020", journal:"Gastroenterologia y Hepatologia", source:"SciELO", citations:434, is_oa:true, doi:"10.1016/j.gastrohep.2020.05.009", evidence_score:2, study_type:"revisão narrativa", expert_reviewed:true, source_quality:"média", potential_bias:"Revisão narrativa sem metodologia sistemática de busca.", abstract_pt:"Revisão abrangente dos mecanismos pelos quais probióticos modulam a microbiota intestinal, incluindo competição com patógenos, produção de SCFAs e modulação da resposta imune da mucosa.", evidence_reason:"Boa cobertura mecanicista, mas sem análise estatística própria e seleção subjetiva.", abnt:"GAREAU, M. G.; SHERMAN, P. M.; WALKER, W. A. Probiotics, gut microbiota and health. Gastroenterologia y Hepatologia, v. 43, n. 6, 2020." },
      { title:"Probiotic patent analysis: strains, formulations and clinical claims", authors:"Tanaka, M., Watanabe, K.", year:"2023", journal:"Lens.org Patent & Literature Review", source:"Lens.org", citations:34, is_oa:false, doi:"10.1016/j.lens.2023.06.078", evidence_score:2, study_type:"revisão narrativa", expert_reviewed:false, source_quality:"média", potential_bias:"Análise de patentes com viés comercial inerente.", abstract_pt:"Cruzamento de 289 patentes com literatura acadêmica sobre probióticos. Identificou que 73% das patentes reivindicam benefícios para SII, mas apenas 31% das cepas patenteadas possuem evidência clínica publicada em periódicos indexados.", evidence_reason:"Dado relevante sobre gap entre marketing/patentes e evidência clínica real.", abnt:"TANAKA, M.; WATANABE, K. Probiotic patent analysis. Lens.org Patent & Literature Review, 2023." },
    ],
    synthesis: {
      direct_answer:"Com base em 21 estudos analisados, probióticos demonstram benefícios consistentes em condições gastrointestinais específicas — principalmente diarreia associada a antibióticos e síndrome do intestino irritável. A evidência de benefício em indivíduos saudáveis é mais fraca. Dados de patentes (Lens.org) revelam que 73% das cepas comercializadas não possuem evidência clínica publicada.",
      consensus_agree:68, consensus_inconclusive:24, consensus_contradict:8,
      confidence_level:"média", confidence_score:3,
      confidence_reasons:["Meta-análise de alta qualidade disponível para condições específicas","Mecanismos biológicos bem documentados","Cruzamento patentes-literatura (Lens.org) expõe gap entre marketing e evidência"],
      inconclusive_summary:"O efeito varia muito entre cepas, doses e condições clínicas. A extrapolação de benefícios de uma cepa para outra não é cientificamente suportada.",
      contradict_explanation:"Estudos em populações saudáveis frequentemente não encontram melhora clínica significativa além do placebo.",
      practical_insight:"Lactobacillus rhamnosus GG e Saccharomyces boulardii têm a maior base de evidências para prevenção de diarreia por antibióticos. Para SII, combinações multiestirpe mostraram maior eficácia.",
      search_tip:"Busque por 'cepas específicas probióticos'.",
      study_recortes:[
        "Ford et al. (2022) quantifica eficácia para condições GI específicas — abordagem de desfecho clínico.",
        "Sanders et al. (2021) investiga o efeito no microbioma em si (diversidade alfa) — abordagem de biomarcador.",
        "Gareau et al. (2020) explica os mecanismos moleculares (SCFAs, resposta imune) — abordagem mecanicista.",
        "Tanaka & Watanabe (2023, via Lens.org) expõe que a maioria das cepas comercializadas carece de evidência — abordagem de integridade comercial.",
      ],
      maturity_label:"Debate ativo",
    },
  },
  {
    keywords: ["saúde única","one health","zoonose","saúde animal","saúde ambiental","saúde pública"],
    count: 37,
    broad: true,
    articles: [
      { title:"One Health approach: integrating human, animal and environmental health surveillance", authors:"Zinsstag, J., Schelling, E., Waltner-Toews, D.", year:"2023", journal:"The Lancet", source:"PubMed", citations:2103, is_oa:false, doi:"10.1016/S0140-6736(22)02585-2", evidence_score:4, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão sistemática de iniciativas One Health em 47 países. A abordagem integrada reduziu custos de vigilância epidemiológica em 22% e detectou surtos zoonóticos em média 18 dias antes das abordagens compartimentadas tradicionais.", evidence_reason:"Revisão sistemática com escopo global e dados comparativos robustos.", abnt:"ZINSSTAG, J. et al. One Health approach. The Lancet, v. 401, p. 1154-1165, 2023." },
      { title:"Antimicrobial resistance and One Health: a systematic review of integrated surveillance studies", authors:"Robinson, T. P., Bu, D. P., Carrique-Mas, J.", year:"2022", journal:"Nature Medicine", source:"Semantic Scholar", citations:1456, is_oa:true, doi:"10.1038/s41591-022-01808-0", evidence_score:5, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Meta-análise de 89 estudos de vigilância integrada de resistência antimicrobiana em interfaces humano-animal-ambiente. Mostra que 62% das resistências em humanos têm origem em reservatórios animais ou ambientais.", evidence_reason:"Meta-análise de alta qualidade com dado de atribuição de resistência antimicrobiana.", abnt:"ROBINSON, T. P. et al. Antimicrobial resistance and One Health. Nature Medicine, v. 28, p. 1231-1245, 2022." },
      { title:"Climate change, land use and emerging zoonoses: a One Health perspective", authors:"Jones, K. E., Patel, N. G., Levy, M. A.", year:"2021", journal:"Science", source:"OpenAlex", citations:987, is_oa:false, doi:"10.1126/science.aab3564", evidence_score:3, study_type:"estudo observacional", expert_reviewed:true, source_quality:"alta", potential_bias:"Dificuldade de estabelecer causalidade entre mudanças ambientais e emergência de doenças.", abstract_pt:"Análise de 335 surtos de doenças emergentes entre 1940 e 2020. Zoonoses representam 60,3% e sua frequência aumentou significativamente com o desmatamento tropical e intensificação agropecuária.", evidence_reason:"Grande base de dados histórica, mas causalidade direta limitada pela natureza observacional.", abnt:"JONES, K. E. et al. Climate change and emerging zoonoses. Science, v. 374, p. 886-892, 2021." },
      { title:"One Health in Latin America: dissertation analysis from institutional repositories", authors:"Oliveira, C. R., Silva, F. M.", year:"2023", journal:"BASE Institutional Repository Index", source:"BASE", citations:18, is_oa:true, doi:"10.18452/base.2023.5678", evidence_score:2, study_type:"revisão narrativa", expert_reviewed:false, source_quality:"média", potential_bias:"Teses e dissertações sem revisão por pares externa.", abstract_pt:"Análise de 43 dissertações e teses latino-americanas sobre Saúde Única indexadas no BASE. Identificou que 68% focam em zoonoses, 22% em resistência antimicrobiana e apenas 10% em impactos ambientais, revelando lacuna na pesquisa regional.", evidence_reason:"Mapeamento de produção acadêmica regional útil para identificar lacunas, mas sem avaliação de qualidade.", abnt:"OLIVEIRA, C. R.; SILVA, F. M. One Health in Latin America: dissertation analysis. BASE Institutional Repository Index, 2023." },
    ],
    synthesis: {
      direct_answer:"Saúde Única (One Health) é um campo de pesquisa transdisciplinar que reconhece a interdependência entre saúde humana, animal e ambiental. A literatura aborda vigilância integrada de zoonoses, resistência antimicrobiana em interfaces multi-espécies, impacto de mudanças climáticas em doenças emergentes e modelos de governança colaborativa entre setores de saúde.",
      consensus_agree:0, consensus_inconclusive:100, consensus_contradict:0,
      confidence_level:"alta", confidence_score:4,
      confidence_reasons:["A vigilância integrada detecta surtos até 18 dias antes de abordagens isoladas","62% das resistências antimicrobianas humanas têm origem em reservatórios animais/ambientais","O campo é consensualmente aceito por OMS, FAO e OIE como abordagem prioritária","Análise de repositórios (BASE) revela lacuna em pesquisa ambiental na América Latina"],
      inconclusive_summary:"Saúde Única é um tema amplo — não existe uma única hipótese central a confirmar ou refutar. Os estudos abordam múltiplas subáreas com diferentes desfechos e populações.",
      contradict_explanation:"",
      practical_insight:"Para pesquisas acadêmicas, refine a busca com uma subárea específica: 'resistência antimicrobiana One Health', 'vigilância zoonoses integrada' ou 'impacto ambiental saúde pública'.",
      search_tip:"Tente: 'zoonoses e mudanças climáticas', 'resistência antimicrobiana animal humano', ou 'vigilância epidemiológica integrada saúde pública'",
      study_recortes:[
        "Zinsstag et al. (2023) avalia eficiência da vigilância integrada em 47 países — abordagem de implementação.",
        "Robinson et al. (2022) quantifica a origem animal/ambiental da resistência antimicrobiana — abordagem de atribuição epidemiológica.",
        "Jones et al. (2021) investiga mudanças climáticas como fator de emergência zoonótica — abordagem ecológica-epidemiológica.",
        "Oliveira & Silva (2023, via BASE) mapeia produção acadêmica latino-americana e identifica lacunas regionais — abordagem bibliométrica.",
      ],
      maturity_label:"Consenso consolidado",
    },
  },
  {
    keywords: ["telepatia","telepathy","leitura mental","mind reading","parapsicologia","psi","esp","extrasensory"],
    count: 12,
    articles: [
      { title:"Does psi exist? Replicable evidence for an anomalous process of information transfer", authors:"Storm, L., Tressoldi, P. E., Di Risio, L.", year:"2010", journal:"Psychological Bulletin", source:"PubMed", citations:412, is_oa:false, doi:"10.1037/a0019457", evidence_score:2, study_type:"meta-análise", expert_reviewed:true, source_quality:"alta", potential_bias:"Autores são pesquisadores de parapsicologia; possível viés de confirmação. Meta-análise criticada por problemas de heterogeneidade e file-drawer effect.", abstract_pt:"Meta-análise de 108 estudos de ganzfeld (protocolo experimental para telepatia). Reportou taxa de acerto de 32% vs. 25% esperado por acaso (p=0,001). Contudo, a magnitude do efeito é muito pequena e críticos apontam falhas no controle de variáveis sensoriais.", evidence_reason:"Meta-análise publicada em periódico de alto impacto, mas com controvérsia significativa na comunidade científica sobre a validade dos resultados.", abnt:"STORM, L.; TRESSOLDI, P. E.; DI RISIO, L. Does psi exist? Psychological Bulletin, v. 136, n. 4, p. 471-485, 2010." },
      { title:"Feeling the future: Experimental evidence for anomalous retroactive influences on cognition and affect", authors:"Bem, D. J.", year:"2011", journal:"Journal of Personality and Social Psychology", source:"Semantic Scholar", citations:867, is_oa:true, doi:"10.1037/a0021524", evidence_score:1, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Análises estatísticas questionáveis. Múltiplas tentativas de replicação falharam. Considerado um caso exemplar de p-hacking pela comunidade estatística.", abstract_pt:"Série de 9 experimentos com 1.000+ participantes alegando evidência de 'precognição'. Publicação gerou amplo debate sobre métodos estatísticos em psicologia e contribuiu para a crise de replicação.", evidence_reason:"Publicado em periódico top, mas falhas metodológicas severas identificadas posteriormente. Replicações independentes não confirmaram os resultados.", abnt:"BEM, D. J. Feeling the future. Journal of Personality and Social Psychology, v. 100, n. 3, p. 407-425, 2011." },
      { title:"Correcting the past: failures to replicate psi", authors:"Galak, J., LeBoeuf, R. A., Nelson, L. D., Simmons, J. P.", year:"2012", journal:"Journal of Personality and Social Psychology", source:"PubMed", citations:543, is_oa:false, doi:"10.1037/a0029709", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Sete tentativas de replicação dos experimentos de Bem (2011) com 3.289 participantes totais. Nenhuma replicação encontrou evidência de precognição ou telepatia. Os autores concluem que os resultados originais refletem artefatos metodológicos, não fenômenos reais.", evidence_reason:"Replicação direta com protocolo pré-registrado e amostras maiores que o estudo original.", abnt:"GALAK, J. et al. Correcting the past: failures to replicate psi. Journal of Personality and Social Psychology, v. 103, n. 6, p. 933-948, 2012." },
      { title:"Parapsychology and the replication crisis: a full-text analysis of open access studies", authors:"Morrison, T., Blake, R.", year:"2023", journal:"CORE Psychology Digest", source:"CORE", citations:28, is_oa:true, doi:"10.5281/zenodo.9012345", evidence_score:3, study_type:"revisão sistemática", expert_reviewed:false, source_quality:"média", potential_bias:"Inclui preprints; busca limitada a acesso aberto.", abstract_pt:"Revisão de 34 estudos em acesso aberto sobre parapsicologia e psi. Identificou que 91% dos estudos com resultados positivos apresentam pelo menos uma falha metodológica grave (p-hacking, HARKing, ou ausência de pré-registro). Estudos pré-registrados não replicam os efeitos.", evidence_reason:"Revisão de acesso aberto que quantifica falhas metodológicas nos estudos positivos.", abnt:"MORRISON, T.; BLAKE, R. Parapsychology and the replication crisis. CORE Psychology Digest, 2023." },
    ],
    synthesis: {
      direct_answer:"Não existe evidência científica confiável de que a telepatia seja um fenômeno real. A literatura apresenta perspectivas complementares e em debate: enquanto pesquisadores de parapsicologia (Storm et al., 2010) reportam efeitos estatísticos pequenos em protocolos ganzfeld, replicações independentes (Galak et al., 2012) com amostras maiores e protocolos pré-registrados não confirmam esses resultados. A análise de acesso aberto (CORE) revelou que 91% dos estudos positivos possuem falhas metodológicas graves.",
      consensus_agree:4, consensus_inconclusive:12, consensus_contradict:84,
      confidence_level:"alta", confidence_score:5,
      confidence_reasons:["Replicações independentes com amostras grandes falharam consistentemente","Mecanismo físico para transferência mental de informação é desconhecido e contradiz a física estabelecida","91% dos estudos positivos possuem falhas metodológicas graves (CORE)","Comunidade científica consensualmente rejeita alegações de telepatia como não comprovadas"],
      inconclusive_summary:"Uma pequena fração de estudos reporta efeitos estatisticamente significativos, mas estes apresentam problemas metodológicos severos e não foram replicados de forma independente.",
      contradict_explanation:"84% dos estudos rigorosos e replicações independentes não encontram evidência de telepatia. Os resultados positivos são atribuídos a falhas estatísticas (p-hacking, viés de publicação) e não a fenômenos genuínos.",
      practical_insight:"Para trabalhos acadêmicos: a telepatia não é reconhecida como fenômeno real pela comunidade científica. Se seu interesse é em comunicação não-verbal, busque por 'comunicação não-verbal inconsciente' ou 'empatia cognitiva neurociência'.",
      search_tip:"Busque por 'crise de replicação parapsicologia' ou 'empatia cognitiva neurociência' para temas adjacentes com base científica sólida.",
      study_recortes:[
        "Storm et al. (2010) tenta demonstrar efeito psi via meta-análise de ganzfeld — abordagem favorável ao fenômeno, mas com heterogeneidade alta.",
        "Bem (2011) alegou precognição com 9 experimentos, mas tornou-se caso exemplar de p-hacking — abordagem experimental com falhas estatísticas severas.",
        "Galak et al. (2012) replica diretamente os experimentos de Bem com 3.289 participantes e não encontra efeito — abordagem de replicação pré-registrada.",
        "Morrison & Blake (2023, via CORE) quantifica que 91% dos estudos positivos têm falhas graves — abordagem de auditoria metodológica.",
      ],
      maturity_label:"Consenso consolidado (contra)",
    },
  },
  {
    keywords: ["dopamina","vício","addiction","dopamine","redes sociais","social media","celular","smartphone","tela","screen"],
    count: 15,
    articles: [
      { title:"Dopamine and reward processing in social media use: a systematic review", authors:"Montag, C., Becker, B., Gan, Y.", year:"2023", journal:"Neuroscience & Biobehavioral Reviews", source:"PubMed", citations:534, is_oa:false, doi:"10.1016/j.neubiorev.2023.105150", evidence_score:4, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão sistemática de 28 estudos de neuroimagem sobre uso de redes sociais e sistema de recompensa dopaminérgico. Notificações e 'likes' ativam o estriado ventral de forma semelhante a recompensas primárias, mas a magnitude da ativação é significativamente menor do que substâncias de abuso.", evidence_reason:"Revisão sistemática com neuroimagem que diferencia a magnitude do efeito de redes sociais vs. substâncias.", abnt:"MONTAG, C.; BECKER, B.; GAN, Y. Dopamine and reward processing in social media use. Neuroscience & Biobehavioral Reviews, v. 148, 2023." },
      { title:"Is 'social media addiction' a valid construct? A critical review of diagnostic criteria", authors:"Billieux, J., Schimmenti, A., Khazaal, Y.", year:"2022", journal:"Journal of Behavioral Addictions", source:"Semantic Scholar", citations:892, is_oa:true, doi:"10.1556/2006.2022.00045", evidence_score:4, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Revisão crítica dos critérios diagnósticos de 'vício em redes sociais'. Argumenta que o termo 'vício' é inapropriado para uso excessivo de tecnologia na maioria dos casos, pois os critérios neuroquímicos de dependência (tolerância, abstinência, uso compulsivo apesar de danos) raramente são atendidos.", evidence_reason:"Revisão crítica de alta qualidade que questiona a validade do constructo 'vício digital'.", abnt:"BILLIEUX, J.; SCHIMMENTI, A.; KHAZAAL, Y. Is social media addiction a valid construct? Journal of Behavioral Addictions, v. 11, n. 2, 2022." },
      { title:"Screen time and dopaminergic system: a functional MRI study in adolescents", authors:"Weinstein, A., Livny, A., Weizman, A.", year:"2021", journal:"Addiction Biology", source:"OpenAlex", citations:345, is_oa:false, doi:"10.1111/adb.13028", evidence_score:3, study_type:"estudo observacional", expert_reviewed:true, source_quality:"alta", potential_bias:"Estudo transversal; não prova causalidade. Amostra limitada a 42 adolescentes.", abstract_pt:"Estudo de fMRI com 42 adolescentes comparando alto uso de telas (>6h/dia) com uso moderado (<2h/dia). O grupo de alto uso mostrou menor resposta dopaminérgica no córtex pré-frontal a tarefas de tomada de decisão, sugerindo dessensibilização parcial — mas sem evidência de 'vício' neuroquímico.", evidence_reason:"Neuroimagem informativa, mas desenho transversal impede conclusões causais.", abnt:"WEINSTEIN, A.; LIVNY, A.; WEIZMAN, A. Screen time and dopaminergic system. Addiction Biology, v. 26, n. 4, 2021." },
      { title:"Digital wellbeing patents and literature: a cross-analysis", authors:"Kim, S., Lee, D.", year:"2023", journal:"Lens.org Digital Health Review", source:"Lens.org", citations:19, is_oa:false, doi:"10.1016/j.lens.2023.09.045", evidence_score:2, study_type:"revisão narrativa", expert_reviewed:false, source_quality:"média", potential_bias:"Viés comercial de análise de patentes.", abstract_pt:"Cruzamento de 178 patentes sobre 'bem-estar digital' com literatura acadêmica. Identificou que empresas de tecnologia patenteiam soluções de 'redução de tempo de tela' enquanto seus próprios algoritmos maximizam engajamento — contradição documentada em 23 patentes vs. 14 artigos.", evidence_reason:"Perspectiva única de cruzamento patentes-literatura, mas sem avaliação clínica.", abnt:"KIM, S.; LEE, D. Digital wellbeing patents and literature. Lens.org Digital Health Review, 2023." },
      { title:"Behavioral addictions in European biomedical literature: a Europe PMC analysis", authors:"García, P., Fernández, M.", year:"2023", journal:"Europe PMC Behavioral Science Reports", source:"Europe PMC", citations:67, is_oa:true, doi:"10.1093/europepmc/pmc.2023.4567", evidence_score:3, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:"Análise de 41 artigos em texto completo via Europe PMC sobre vícios comportamentais e tecnologia. Confirma que o termo 'vício em dopamina' é uma simplificação midiática: o sistema dopaminérgico está envolvido em toda motivação humana, não apenas em comportamentos patológicos.", evidence_reason:"Revisão com acesso a textos completos que contextualiza o papel da dopamina além do vício.", abnt:"GARCÍA, P.; FERNÁNDEZ, M. Behavioral addictions in European biomedical literature. Europe PMC Behavioral Science Reports, 2023." },
    ],
    synthesis: {
      direct_answer:"A literatura apresenta perspectivas complementares e em debate sobre a relação entre dopamina, redes sociais e 'vício'. O Estudo A (Montag et al.) foca no mecanismo neurobiológico e confirma que redes sociais ativam o sistema de recompensa dopaminérgico, mas com magnitude muito menor que substâncias de abuso. O Estudo B (Billieux et al.) analisa a validade do constructo 'vício' e argumenta que o termo é inapropriado na maioria dos casos. A expressão popular 'vício em dopamina' é uma simplificação midiática que não reflete a complexidade do sistema dopaminérgico.",
      consensus_agree:35, consensus_inconclusive:40, consensus_contradict:25,
      confidence_level:"média", confidence_score:3,
      confidence_reasons:["Revisões sistemáticas de alta qualidade disponíveis, mas com conclusões divergentes sobre a validade do constructo","Neuroimagem confirma ativação dopaminérgica, mas não equivale a 'vício' neuroquímico","Cruzamento patentes-literatura (Lens.org) expõe contradição na indústria tech","Europe PMC contextualiza que dopamina ≠ vício; sistema envolvido em toda motivação"],
      inconclusive_summary:"A comunidade científica debate se o uso excessivo de redes sociais constitui um 'vício' genuíno ou se é um comportamento problemático sem os critérios neuroquímicos de dependência. O termo 'vício em dopamina' popularizado pela mídia não é aceito na literatura científica.",
      contradict_explanation:"25% dos estudos contradizem a narrativa de 'vício digital': argumentam que os critérios diagnósticos de dependência (tolerância, abstinência fisiológica, uso compulsivo apesar de danos severos) raramente são atendidos no uso de redes sociais.",
      practical_insight:"Para trabalhos acadêmicos, prefira o termo 'uso problemático de tecnologia' em vez de 'vício em redes sociais'. O sistema dopaminérgico está envolvido em toda motivação humana (comida, exercício, música), não apenas em comportamentos patológicos.",
      search_tip:"Busque por 'uso problemático de tecnologia' ou 'design persuasivo e engajamento digital' para termos com maior aceitação científica.",
      study_recortes:[
        "Montag et al. (2023) investiga a ativação do estriado ventral por notificações — abordagem de neuroimagem mecanicista, confirma envolvimento dopaminérgico mas em magnitude inferior a drogas.",
        "Billieux et al. (2022) questiona a validade do constructo 'vício em redes sociais' — abordagem nosológica/diagnóstica, argumenta que critérios de dependência não são atendidos.",
        "Weinstein et al. (2021) compara resposta dopaminérgica em adolescentes com alto vs. baixo uso de telas — abordagem de dessensibilização, mas sem prova causal.",
        "García et al. (2023, via Europe PMC) contextualiza que 'vício em dopamina' é simplificação midiática — abordagem de revisão conceitual.",
        "Kim & Lee (2023, via Lens.org) revela contradição entre patentes de 'bem-estar digital' e algoritmos de maximização de engajamento — abordagem de integridade corporativa.",
      ],
      maturity_label:"Debate ativo",
    },
  },
];

export type QueryType = "hypothesis" | "broad" | "comparison";

export const classifyQuery = (q: string): QueryType => {
  const ql = q.toLowerCase().trim();
  if (/vs\.?|versus|ou.{1,20}ou|comparad|melhor.*pior|pior.*melhor/.test(ql)) return "comparison";
  const causalWords = /reduz|aumenta|melhora|causa|previne|trata|afeta|impacta|associa|relaciona|diminui|eleva|piora|beneficia|prejudica|influencia|provoca|leva a|resulta|gera|favorece|protege|ajuda|existe|vício|vicia/i;
  const questionWords = /\?|será que|é verdade|funciona|eficaz|efetivo/i;
  if (causalWords.test(ql) || (questionWords.test(ql) && ql.split(" ").length > 3)) return "hypothesis";
  return "broad";
};

export const findMatch = (query: string): MockEntry => {
  const ql = query.toLowerCase();
  const match = MOCK_DB.find((m) => m.keywords.some((k) => ql.includes(k.toLowerCase())));
  if (match) return match;
  
  return {
    count: Math.floor(8 + Math.random() * 12),
    keywords: [],
    articles: [
      { title:`Systematic review on: ${query}`, authors:"Silva, M. A., Santos, R. C., Oliveira, J. P.", year:"2023", journal:"Brazilian Journal of Medical Research", source:"SciELO", citations:234, is_oa:true, doi:"10.1590/s0100-40422023000100001", evidence_score:4, study_type:"revisão sistemática", expert_reviewed:true, source_quality:"alta", potential_bias:"Nenhum identificado", abstract_pt:`Revisão sistemática de 14 estudos sobre "${query}". Os resultados indicam evidência moderada a forte para o desfecho primário investigado, com consistência entre estudos de diferentes países e populações.`, evidence_reason:"Revisão sistemática com protocolo PRISMA registrado.", abnt:`SILVA, M. A. et al. Systematic review on ${query}. Brazilian Journal of Medical Research, v. 56, n. 1, 2023.` },
      { title:`Randomized controlled trial investigating ${query}`, authors:"Johnson, T. R., Williams, K. M., Thompson, A.", year:"2022", journal:"Journal of Clinical Research", source:"PubMed", citations:156, is_oa:false, doi:"10.1016/j.jcr.2022.08.012", evidence_score:4, study_type:"ensaio clínico randomizado", expert_reviewed:true, source_quality:"alta", potential_bias:"Amostra de conveniência; pode limitar generalização.", abstract_pt:`Ensaio clínico randomizado com 180 participantes avaliando a intervenção referente a "${query}". O grupo intervenção apresentou melhora significativa no desfecho primário (p=0,008) após 16 semanas de seguimento.`, evidence_reason:"RCT com grupo controle ativo e desfecho pré-registrado.", abnt:`JOHNSON, T. R. et al. Randomized controlled trial on ${query}. Journal of Clinical Research, v. 34, p. 112-124, 2022.` },
      { title:`Cross-repository analysis of open access literature on ${query}`, authors:"Weber, L., Costa, R.", year:"2023", journal:"CORE Research Digest", source:"CORE", citations:45, is_oa:true, doi:"10.5281/zenodo.generic001", evidence_score:3, study_type:"revisão narrativa", expert_reviewed:false, source_quality:"média", potential_bias:"Inclui preprints não revisados por pares.", abstract_pt:`Análise de artigos em acesso aberto sobre "${query}" agregados pelo CORE. Identifica tendências de publicação e confirma que os resultados são consistentes com revisões de bases tradicionais, embora com menor rigor metodológico.`, evidence_reason:"Agregação de acesso aberto útil para mapeamento, mas inclui preprints.", abnt:`WEBER, L.; COSTA, R. Cross-repository analysis on ${query}. CORE Research Digest, 2023.` },
    ],
    synthesis: {
      direct_answer:`Com base nos estudos analisados sobre "${query}", a literatura científica apresenta evidências de qualidade moderada a alta. Os resultados são consistentes entre diferentes populações, mas o tamanho do efeito varia entre os estudos.`,
      consensus_agree:65, consensus_inconclusive:25, consensus_contradict:10,
      confidence_level:"média", confidence_score:3,
      confidence_reasons:["Estudos de qualidade moderada disponíveis","Resultados relativamente consistentes","Dados de repositórios abertos (CORE) confirmam tendências"],
      inconclusive_summary:"A magnitude do efeito e os subgrupos que mais se beneficiam ainda precisam de mais estudos.",
      contradict_explanation:"Alguns estudos com desenhos metodológicos mais rígidos mostram efeitos menores.",
      practical_insight:"Os estudos disponíveis sugerem benefício, mas recomenda-se consultar um especialista para aplicação clínica individualizada.",
      search_tip:"Tente refinar a busca adicionando uma população específica (ex: adultos, idosos) ou desfecho (ex: qualidade de vida, marcadores laboratoriais).",
      study_recortes:[
        `Os estudos encontrados abordam "${query}" de diferentes ângulos — revise os recortes individuais nos cards para entender como cada estudo contribui.`,
      ],
      maturity_label:"Evidência emergente",
    },
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

export const CONFIDENCE_EXPLANATIONS: Record<string, string> = {
  "alta": "A confiança é ALTA porque os estudos incluem meta-análises e/ou revisões sistemáticas de alta qualidade, com consistência entre resultados e baixo risco de viés.",
  "média": "A confiança é MODERADA porque, embora existam estudos de qualidade, há limitações como amostras pequenas, poucos ensaios clínicos randomizados ou questões de causalidade não completamente resolvidas.",
  "baixa": "A confiança é BAIXA porque os estudos disponíveis são principalmente observacionais, com amostras limitadas, alto risco de viés ou resultados inconsistentes entre si.",
};

export const SOURCE_LIST = [
  "PubMed", "OpenAlex", "Semantic Scholar", "CrossRef", "DOAJ", "SciELO", "arXiv",
  "Europe PMC", "BASE", "Lens.org", "CORE",
];

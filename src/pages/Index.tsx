import { useState, type FormEvent } from "react";
import {
  Search,
  BookOpen,
  Clock,
  BrainCircuit,
  Target,
  Lightbulb,
  Bot,
  Zap,
  BotMessageSquare,
  ArrowRight,
} from "lucide-react";

// ── MOCK DB ──
const MOCK_DB = [
  {
    keywords: ["retinol","linhas finas","adultos","envelhecimento"],
    count: 22,
    articles: [
      { title:"Retinoids in skin aging: an overview", authors:"Kafi, R., et al.", year:"2022", journal:"Clinical Interventions in Aging", source:"PubMed", evidence_score:5, study_type:"revisão sistemática", abstract_pt:"Meta-análise de 31 ECRs demonstrando que retinol 0,1% a 1% reduz significativamente linhas finas após 12 semanas." },
    ],
    synthesis: { direct_answer:"Sim, o retinol tópico reduz linhas finas e melhora a textura da pele em adultos de forma significativa, com efeito dose-dependente após 12-24 semanas de uso.", consensus_agree:82, consensus_inconclusive:12, consensus_contradict:6, confidence_level:"alta", practical_insight:"Retinol 0,3%-0,5% à noite é o protocolo mais comum nos estudos.", search_tip:"Tente 'retinol e fotoproteção diária'." },
  },
  {
    keywords: ["exercício aeróbico","melhora","depressão clínica"],
    count: 18,
    articles: [
      { title:"Exercise as a treatment for depression", authors:"Blumenthal, J. A., et al.", year:"2023", journal:"JAMA Psychiatry", source:"PubMed", evidence_score:5, study_type:"meta-análise", abstract_pt:"Esta meta-análise avaliou 45 ensaios clínicos, mostrando que exercício de intensidade moderada reduz sintomas depressivos de forma comparável a antidepressivos." },
    ],
    synthesis: { direct_answer:"Com base em 18 estudos analisados, o exercício aeróbico reduz significativamente os sintomas da depressão clínica, com eficácia comparável aos antidepressivos em casos leves.", consensus_agree:78, consensus_inconclusive:15, consensus_contradict:7, confidence_level:"alta", practical_insight:"30 min de aeróbico 3x/semana mostram benefícios mensuráveis.", search_tip:"Busque por 'modalidade do exercício e saúde mental'." },
  },
  {
    keywords: ["sono fragmentado","aumenta","risco de alzheimer"],
    count: 14,
    articles: [
      { title:"Sleep fragmentation and risk of Alzheimer's", authors:"Lucey, B. P., et al.", year:"2023", journal:"Nature Medicine", source:"PubMed", evidence_score:3, study_type:"coorte", abstract_pt:"Estudo de coorte com 4.417 adultos mostrou que fragmentação severa do sono elevou em 1.68x o risco de Alzheimer." },
    ],
    synthesis: { direct_answer:"A fragmentação do sono está consistentemente associada ao aumento do risco de Alzheimer, sugerindo acúmulo de β-amiloide durante o sono interrompido.", consensus_agree:71, consensus_inconclusive:22, consensus_contradict:7, confidence_level:"média", practical_insight:"Manter 7-9h de sono consolidado pode ser uma estratégia preventiva.", search_tip:"Busque por 'sono de ondas lentas e Alzheimer'." },
  },
  {
    keywords: ["meditação mindfulness","reduz","ansiedade"],
    count: 19,
    articles: [
      { title:"MBSR and anxiety: a meta-analysis", authors:"Hofmann, S. G., et al.", year:"2022", journal:"J. Consult Clin Psychol", source:"Semantic Scholar", evidence_score:5, study_type:"meta-análise", abstract_pt:"Meta-análise de 39 estudos avaliando MBSR e MBCT mostrou efeito moderado-grande na redução de ansiedade." },
    ],
    synthesis: { direct_answer:"A meditação mindfulness (especialmente MBSR e MBCT) reduz sintomas de ansiedade com magnitude de efeito moderada.", consensus_agree:74, consensus_inconclusive:19, consensus_contradict:7, confidence_level:"alta", practical_insight:"MBSR de 8 semanas é o protocolo com maior evidência.", search_tip:"Refine para 'formato presencial vs app'." },
  },
  {
    keywords: ["probióticos","melhoram","saúde intestinal"],
    count: 16,
    articles: [
      { title:"Probiotics for GI disorders: systematic review", authors:"Ford, A. C., et al.", year:"2022", journal:"Gut", source:"PubMed", evidence_score:5, study_type:"meta-análise", abstract_pt:"Meta-análise de 53 ECRs mostrou que probióticos multiestirpe reduziram sintomas de SII (RR=0.79)." },
    ],
    synthesis: { direct_answer:"Probióticos demonstram benefícios consistentes em condições gastrointestinais específicas, principalmente diarreia associada a antibióticos e SII.", consensus_agree:68, consensus_inconclusive:24, consensus_contradict:8, confidence_level:"média", practical_insight:"Cepas como L. rhamnosus GG e S. boulardii têm mais evidência.", search_tip:"Busque por 'cepas específicas probióticos'." },
  },
];

interface ArticleData {
  title: string;
  authors: string;
  year: string;
  journal: string;
  source: string;
  evidence_score: number;
  study_type: string;
  abstract_pt: string;
}

interface SynthesisData {
  direct_answer: string;
  consensus_agree: number;
  consensus_inconclusive: number;
  consensus_contradict: number;
  confidence_level: string;
  practical_insight: string;
  search_tip: string;
}

interface MockEntry {
  keywords: string[];
  count: number;
  articles: ArticleData[];
  synthesis: SynthesisData;
}

const SC_BADGES = [
  { name: "PubMed", color: "#EF4444" },
  { name: "OpenAlex", color: "#3B82F6" },
  { name: "Semantic Scholar", color: "#A78BFA" },
  { name: "CrossRef", color: "#2DD4BF" },
  { name: "DOAJ", color: "#38BDF8" },
  { name: "SciELO", color: "#22C55E" },
  { name: "arXiv", color: "#F97316" },
];

const QUICK_SEARCHES = [
  "retinol reduz linhas finas em adultos?",
  "exercício aeróbico melhora depressão clínica?",
  "sono fragmentado aumenta risco de Alzheimer?",
  "meditação mindfulness reduz ansiedade?",
  "probióticos melhoram saúde intestinal?",
];

const Index = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<MockEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchesLeft, setSearchesLeft] = useState(3);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setQuery(searchTerm);
    setTimeout(() => {
      const ql = searchTerm.toLowerCase();
      const match = MOCK_DB.find(
        (m) =>
          m.keywords.some((k) => ql.includes(k)) ||
          ql.includes(m.keywords[0]) ||
          m.keywords.every((k) => ql.includes(k))
      );
      setResult(match || null);
      setLoading(false);
      setSearchesLeft((prev) => Math.max(0, prev - 1));
    }, 1200);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleBack = () => {
    setResult(null);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground relative">
      {/* HEADER */}
      <header className="flex items-center justify-between p-4 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-primary size-6" />
          <button onClick={handleBack} className="flex items-center gap-0">
            <h1 className="text-xl font-extrabold tracking-tight">
              Scholar<span className="text-primary">IA</span>
            </h1>
          </button>
          <span className="bg-foreground/10 text-xs font-bold px-2 py-0.5 rounded text-primary">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card/50 border border-foreground/10 text-primary px-4 py-1.5 rounded-xl text-sm font-semibold">
            {searchesLeft} buscas restantes
          </div>
          <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Planos
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center">
        {/* LANDING STATE */}
        {!result && !loading && (
          <div className="w-full text-center flex flex-col items-center">
            <div className="bg-foreground/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 mb-6 border border-foreground/5">
              <BookOpen size={16} /> PARA PESQUISA ACADÊMICA
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 leading-tight">
              Seu assistente de <br />
              <span className="text-primary">pesquisa científica</span>
            </h2>

            <p className="text-secondary-foreground text-lg mb-12 max-w-2xl">
              Busca em 7 bases simultâneas, filtra os artigos revisados por
              especialistas e mostra o nível de confiabilidade de cada fonte.
            </p>

            {/* SEARCH BAR */}
            <form onSubmit={handleSubmit} className="relative w-full mb-16">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={'"retinol reduz linhas finas?" ou "sono causa Alzheimer?"'}
                className="w-full p-5 sm:p-6 pl-14 sm:pl-16 pr-4 sm:pr-52 rounded-full bg-card/40 border border-foreground/10 text-base sm:text-lg placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-shadow"
              />
              <BrainCircuit className="absolute left-5 sm:left-6 top-5 sm:top-6 text-muted-foreground" size={22} />
              <button
                type="submit"
                className="sm:absolute sm:right-3 sm:top-3 mt-3 sm:mt-0 w-full sm:w-auto bg-primary text-primary-foreground px-6 sm:px-8 py-3 rounded-full font-bold text-base hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                Buscar e analisar <ArrowRight size={18} />
              </button>
            </form>

            {/* Info */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
              <span>{searchesLeft} buscas gratuitas, sem cadastro</span>
              <button className="flex items-center gap-2 hover:text-foreground transition-colors">
                <BotMessageSquare size={16} /> Analisar um PDF
              </button>
            </div>

            {/* SOURCE BADGES */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-2xl">
              {SC_BADGES.map((sc) => (
                <span
                  key={sc.name}
                  style={{
                    backgroundColor: `${sc.color}15`,
                    color: sc.color,
                    borderColor: `${sc.color}30`,
                  }}
                  className="px-3 py-1 rounded-full text-xs font-semibold border"
                >
                  {sc.name}
                </span>
              ))}
            </div>

            {/* QUICK SEARCHES */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
              {QUICK_SEARCHES.map((search) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className="bg-card/50 border border-foreground/5 hover:border-primary/30 px-5 py-2.5 rounded-full text-sm text-secondary-foreground hover:text-foreground transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="text-center py-24 flex flex-col items-center gap-4 text-primary font-bold animate-pulse text-xl">
            <BrainCircuit className="size-12 animate-spin" />
            Analisando bases científicas...
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div className="w-full space-y-8 animate-fade-up">
            {/* Mini search bar at top */}
            <form onSubmit={handleSubmit} className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-4 pl-12 pr-32 rounded-full bg-card/40 border border-foreground/10 text-base placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
              />
              <Search className="absolute left-4 top-4 text-muted-foreground" size={20} />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all"
              >
                Buscar
              </button>
            </form>

            {/* SYNTHESIS PANEL */}
            <div className="bg-card/60 rounded-3xl p-6 sm:p-8 border border-foreground/5 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    "{query}"
                  </h3>
                  <div className="text-sm font-semibold text-primary flex items-center gap-1.5">
                    <Target size={15} /> Interpretação baseada em{" "}
                    {result.count} estudos científicos
                  </div>
                </div>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase shrink-0 ${
                    result.synthesis.confidence_level === "alta"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-orange-500/20 text-orange-400"
                  }`}
                >
                  Confiança {result.synthesis.confidence_level}
                </span>
              </div>

              {/* Direct answer */}
              <div className="p-5 sm:p-6 bg-foreground/5 rounded-2xl border border-foreground/10 mb-8">
                <p className="text-base text-foreground/90 italic leading-relaxed">
                  "{result.synthesis.direct_answer}"
                </p>
              </div>

              {/* Consensus metrics */}
              <div className="space-y-3 mb-8">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Consenso da Literatura
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-4 bg-foreground/5 rounded-xl border border-foreground/10">
                    <div className="text-3xl font-black text-emerald-400">
                      {result.synthesis.consensus_agree}%
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Concordam
                    </div>
                  </div>
                  <div className="text-center p-4 bg-foreground/5 rounded-xl border border-foreground/10">
                    <div className="text-3xl font-black text-amber-400">
                      {result.synthesis.consensus_inconclusive}%
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Inconclusivo
                    </div>
                  </div>
                  <div className="text-center p-4 bg-foreground/5 rounded-xl border border-foreground/10">
                    <div className="text-3xl font-black text-rose-400">
                      {result.synthesis.consensus_contradict}%
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Contradizem
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="space-y-3 border-t border-foreground/10 pt-6">
                <div className="flex items-start gap-3 text-sm">
                  <Lightbulb
                    className="text-primary shrink-0 mt-0.5"
                    size={18}
                  />
                  <p>
                    <strong className="text-foreground">
                      Insight Prático:
                    </strong>{" "}
                    <span className="text-secondary-foreground">
                      {result.synthesis.practical_insight}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Zap
                    className="text-muted-foreground shrink-0 mt-0.5"
                    size={18}
                  />
                  <p>
                    <strong className="text-muted-foreground">
                      Dica de Busca:
                    </strong>{" "}
                    <span className="text-muted-foreground">
                      {result.synthesis.search_tip}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* ARTICLES */}
            <div className="space-y-4">
              {result.articles.map((art, i) => (
                <div
                  key={i}
                  className="bg-card/40 p-6 rounded-2xl border border-foreground/5 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase border border-primary/20">
                      {art.study_type}
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Zap size={13} /> {art.source}
                      <Clock size={13} /> {art.year}
                    </div>
                  </div>
                  <h4 className="font-bold text-foreground text-lg leading-tight mb-2">
                    {art.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-5">
                    {art.authors} • {art.journal}
                  </p>
                  <div className="bg-background/60 p-5 rounded-xl text-sm text-foreground/80 italic border border-foreground/5 leading-relaxed">
                    "{art.abstract_pt}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bot Button */}
      <button className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:brightness-110 active:scale-[0.95] transition-all z-50">
        <Bot size={24} />
      </button>
    </div>
  );
};

export default Index;

import { useState, useRef, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useInView } from "@/hooks/useInView";
import {
  BookOpen,
  BrainCircuit,
  ArrowRight,
  BotMessageSquare,
  MessageSquarePlus,
  X,
  Database,
  BarChart3,
  Gauge,
  FileText,
  Link2,
  FileSearch,
  Sun,
  Moon,
  Menu,
  Zap,
  LogIn,
  LogOut,
  UserCircle,
  Search,
  Layers,
  ShieldCheck,
  Quote,
  Sparkles,
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth, getLocalSearchesLeftPublic } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { type MockEntry } from "@/data/mockDatabase";
import ResultsView from "@/components/ResultsView";
import PlansModal from "@/components/PlansModal";
import FeedbackModal from "@/components/FeedbackModal";
import AuthModal from "@/components/AuthModal";

const SC_BADGES = [
  { name: "PubMed", color: "#EF4444" },
  { name: "Semantic Scholar", color: "#A78BFA" },
  { name: "Cochrane", color: "#7C3AED" },
  { name: "SciELO", color: "#22C55E" },
  { name: "arXiv", color: "#F97316" },
  { name: "OpenAlex", color: "#60A5FA" },
  { name: "CrossRef", color: "#F59E0B" },
  { name: "DOAJ", color: "#34D399" },
  { name: "Europe PMC", color: "#818CF8" },
  { name: "CORE", color: "#FB923C" },
  { name: "Lens.org", color: "#38BDF8" },
  { name: "BVS/LILACS", color: "#4ADE80" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Search,
    title: "Faça sua pergunta",
    desc: "Em português, como você pensaria. Pode ser uma dúvida clínica, tema de dissertação ou hipótese de pesquisa.",
  },
  {
    step: "02",
    icon: Layers,
    title: "Clara busca em 13 bases",
    desc: "PubMed, Cochrane, SciELO, arXiv e mais — simultaneamente, em segundos, sem você precisar acessar cada uma.",
  },
  {
    step: "03",
    icon: ShieldCheck,
    title: "Receba síntese com confiança",
    desc: "Cada artigo tem ICM, tipo de estudo e ABNT automático. Você vê o consenso entre os estudos de forma imediata.",
  },
];

const DIFFERENTIALS = [
  {
    icon: AlertTriangle,
    iconColor: "text-rose-400",
    bgColor: "bg-rose-500/10 border-rose-500/20",
    label: "IAs convencionais",
    points: [
      "Inventam referências que não existem",
      "Sem acesso a publicações recentes",
      "Uma resposta genérica, sem fontes verificáveis",
    ],
    negative: true,
  },
  {
    icon: CheckCircle2,
    iconColor: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    label: "Clara",
    points: [
      "Artigos reais com DOI verificável",
      "Dados em tempo real das maiores bases",
      "Consenso, ICM e ABNT — tudo junto",
    ],
    negative: false,
  },
  {
    icon: Clock,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    label: "Fazer sozinho",
    points: [
      "Horas navegando em bases separadas",
      "Sem síntese nem análise de consenso",
      "Formatação ABNT manual e propensa a erros",
    ],
    negative: true,
  },
];

const QUICK_SEARCHES = [
  "exercício aeróbico reduz sintomas de depressão clínica?",
  "microbiota intestinal influencia saúde mental?",
  "CRISPR-Cas9 eficácia em terapia gênica humana",
  "sono fragmentado aumenta risco de Alzheimer?",
  "mindfulness reduz ansiedade em universitários?",
  "resistência antimicrobiana: origem animal e humana",
];

const FEATURES = [
  { icon: Layers, color: "text-blue-400", bg: "bg-blue-500/10", title: "13 bases simultâneas", desc: "PubMed, Cochrane, SciELO, arXiv, OpenAlex e mais — uma busca, todas as fontes relevantes da ciência." },
  { icon: GitMerge, color: "text-violet-400", bg: "bg-violet-500/10", title: "Análise de consenso", desc: "Veja o percentual de estudos que concordam, divergem ou são inconclusivos sobre o tema." },
  { icon: Gauge, color: "text-primary", bg: "bg-primary/10", title: "ICM — Índice de Confiança", desc: "Cada artigo é pontuado pelo design, citações e revisão por pares. Meta-análises pesam mais." },
  { icon: Quote, color: "text-amber-400", bg: "bg-amber-500/10", title: "ABNT automático", desc: "Citação gerada e copiável com um clique. Sem formatar manualmente nunca mais." },
  { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "DOI verificável", desc: "Link direto para o artigo original. Você confere antes de citar — sem alucinar fontes." },
  { icon: Sparkles, color: "text-rose-400", bg: "bg-rose-500/10", title: "Síntese por IA", desc: "Resumo interpretativo em português, contextualizado à sua pergunta. Salve e compartilhe." },
];

// ── Subcomponentes animados ────────────────────────────────────────────────────

function AnimSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`animate-fade-up ${inView ? "in-view" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

function HeroSection({ query, setQuery, handleSubmit, handleSearch, loading, searchError, searchesLeft, setShowPlans }: {
  query: string; setQuery: (v: string) => void;
  handleSubmit: (e: FormEvent) => void;
  handleSearch: (s: string) => void;
  loading: boolean; searchError: string | null;
  searchesLeft: number; setShowPlans: (v: boolean) => void;
}) {
  return (
    <section className="hero-grid w-full px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12 flex flex-col items-center">
      <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 mb-5 border border-primary/20 tracking-wide uppercase">
        <Sparkles size={11} /> Pesquisa científica com IA
      </div>

      <h2 className="font-display text-2xl sm:text-4xl md:text-[2.75rem] font-extrabold text-foreground mb-2 leading-tight text-center max-w-2xl glow-primary">
        Seu assistente de{" "}
        <span className="text-primary">pesquisa científica</span>
      </h2>

      <p className="text-xs sm:text-sm text-muted-foreground/70 mb-4 italic tracking-wide text-center">
        Evidências claras, decisões melhores
      </p>

      <p className="text-foreground/55 text-sm mb-7 reading-width text-center px-2 leading-relaxed">
        Busca simultânea em 13 bases científicas com análise de consenso,
        confiança metodológica e referências ABNT automáticas, em português.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-card/70 border border-foreground/10 rounded-2xl p-3 sm:p-5 mb-4 shadow-xl backdrop-blur-sm">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: microbiota intestinal e saúde mental: existe consenso?"
            className="w-full py-3 pl-10 pr-9 rounded-xl bg-background/60 border border-foreground/10 text-sm placeholder:text-muted-foreground/55 focus:ring-2 focus:ring-primary outline-none"
          />
          {query && (
            <button type="button" aria-label="Limpar busca" onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={15} />
            </button>
          )}
        </div>
        <button type="submit"
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-display">
          Buscar e analisar <ArrowRight size={16} />
        </button>
      </form>

      {loading && (
        <div className="text-center py-10 flex flex-col items-center gap-3 text-primary font-bold animate-pulse">
          <BrainCircuit className="size-10 animate-spin" />
          Analisando bases científicas...
        </div>
      )}
      {searchError && !loading && (
        <div className="text-center py-6 text-destructive"><p className="font-semibold text-sm">{searchError}</p></div>
      )}

      {!loading && (
        <>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-5 text-xs text-muted-foreground mb-5">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-primary" /> Gratuito, sem cadastro</span>
            <button onClick={() => setShowPlans(true)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <BotMessageSquare size={13} /> Analisar um PDF
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6 max-w-3xl">
            {SC_BADGES.map((sc) => (
              <span key={sc.name}
                style={{ backgroundColor: `${sc.color}15`, color: sc.color, borderColor: `${sc.color}30` }}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border">
                {sc.name}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-3xl">
            {QUICK_SEARCHES.map((search) => (
              <button key={search} onClick={() => handleSearch(search)}
                className="bg-card/50 border border-foreground/10 hover:border-primary/40 hover:bg-primary/5 px-3.5 py-1.5 rounded-full text-xs text-foreground/55 hover:text-foreground transition-all">
                {search}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HowItWorksSection() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref as React.RefObject<HTMLElement>}
      className="w-full border-t border-foreground/5 px-5 py-14">
      <div className="max-w-4xl mx-auto">
        <p className={`animate-fade-in ${inView ? "in-view" : ""} text-[11px] font-bold text-primary uppercase tracking-widest text-center mb-2`}>Como funciona</p>
        <h3 className={`animate-fade-up ${inView ? "in-view" : ""} delay-100 font-display text-xl md:text-2xl font-extrabold text-foreground text-center mb-10`}>
          De uma pergunta à evidência, em segundos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
          <div className="hidden md:block absolute top-9 left-[calc(16.5%+1rem)] right-[calc(16.5%+1rem)] h-px bg-foreground/8" />
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step}
              className={`animate-fade-up ${inView ? "in-view" : ""} delay-${(i + 1) * 100} flex flex-col items-center text-center px-3`}>
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <step.icon size={26} className="text-primary" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                  {step.step.slice(1)}
                </span>
              </div>
              <h4 className="font-display font-bold text-foreground text-sm mb-1.5">{step.title}</h4>
              <p className="text-foreground/50 text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyClaraSection() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref as React.RefObject<HTMLElement>}
      className="w-full bg-foreground/[0.02] border-t border-foreground/5 px-5 py-14">
      <div className="max-w-4xl mx-auto">
        <p className={`animate-fade-in ${inView ? "in-view" : ""} text-[11px] font-bold text-primary uppercase tracking-widest text-center mb-2`}>Por que Clara?</p>
        <h3 className={`animate-fade-up ${inView ? "in-view" : ""} delay-100 font-display text-xl md:text-2xl font-extrabold text-foreground text-center mb-2`}>
          IAs inventam. Bases não sintetizam.<br />Clara faz os dois com evidência real.
        </h3>
        <p className={`animate-fade-up ${inView ? "in-view" : ""} delay-200 text-foreground/45 text-center text-xs mb-8 reading-width mx-auto`}>
          Pesquisadores e estudantes precisam de fontes verificáveis, não de respostas inventadas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DIFFERENTIALS.map((d, i) => (
            <div key={d.label}
              className={`animate-fade-up ${inView ? "in-view" : ""} delay-${(i + 1) * 100} rounded-xl border p-5 card-lift ${d.bgColor} ${d.negative ? "opacity-75" : ""}`}>
              <div className="flex items-center gap-2.5 mb-4">
                <d.icon size={17} className={d.iconColor} />
                <span className={`font-display font-bold text-xs ${d.negative ? "text-foreground/65" : "text-foreground"}`}>{d.label}</span>
                {!d.negative && <span className="ml-auto bg-primary/20 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">Melhor opção</span>}
              </div>
              <ul className="space-y-2.5">
                {d.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs text-foreground/65 leading-snug">
                    <span className={`mt-0.5 shrink-0 font-bold ${d.negative ? "text-foreground/25" : "text-primary"}`}>
                      {d.negative ? "×" : "✓"}
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref as React.RefObject<HTMLElement>}
      className="w-full border-t border-foreground/5 px-5 py-14">
      <div className="max-w-4xl mx-auto">
        <p className={`animate-fade-in ${inView ? "in-view" : ""} text-[11px] font-bold text-primary uppercase tracking-widest text-center mb-2`}>Recursos</p>
        <h3 className={`animate-fade-up ${inView ? "in-view" : ""} delay-100 font-display text-xl md:text-2xl font-extrabold text-foreground text-center mb-2`}>
          Feita para quem decide com base em evidências
        </h3>
        <p className={`animate-fade-up ${inView ? "in-view" : ""} delay-200 text-foreground/45 text-center text-xs mb-8 reading-width mx-auto`}>
          Cada resultado traz contexto suficiente para avaliar, citar e seguir em frente sem abrir 13 abas diferentes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title}
              className={`animate-fade-up ${inView ? "in-view" : ""} delay-${Math.min((i + 1) * 100, 400)} bg-card/40 border border-foreground/5 rounded-xl p-5 card-lift hover:border-foreground/12`}>
              <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                <f.icon size={18} className={f.color} />
              </div>
              <h4 className="font-display font-bold text-foreground text-xs mb-1.5">{f.title}</h4>
              <p className="text-foreground/45 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ searchesLeft }: { searchesLeft: number }) {
  const { ref, inView } = useInView();
  return (
    <section ref={ref as React.RefObject<HTMLElement>}
      className="w-full border-t border-foreground/5 px-5 py-14">
      <div className={`animate-fade-up ${inView ? "in-view" : ""} max-w-md mx-auto text-center`}>
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <BrainCircuit size={24} className="text-primary" />
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground mb-2">
          Comece agora, é gratuito
        </h3>
        <p className="text-muted-foreground text-xs mb-6 leading-relaxed">
          Sem cadastro. Resultados reais de bases científicas indexadas.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all inline-flex items-center gap-2 font-display">
          Fazer minha primeira busca <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

const Index = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<MockEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authReason, setAuthReason] = useState<"searches_exhausted" | "default">("default");
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesisFailed, setSynthesisFailed] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [realSources, setRealSources] = useState<string[] | undefined>(undefined);

  const { user, signOut, decrementSearch } = useAuth();

  // searchesLeft: use Supabase user when available, localStorage otherwise
  const searchesLeft = user?.searchesLeft ?? getLocalSearchesLeftPublic();

  const handleSearch = async (searchTerm: string, options?: { lang?: string }) => {
    if (!searchTerm.trim()) return;

    // Gate: check remaining searches before consuming
    if (searchesLeft <= 0) {
      if (isSupabaseConfigured && !user) {
        setAuthReason("searches_exhausted");
        setShowAuth(true);
      } else {
        setShowPlans(true);
      }
      return;
    }

    setLoading(true);
    setSynthesisLoading(false);
    setSynthesisFailed(false);
    setResult(null);
    setSearchError(null);
    setQuery(searchTerm);

    try {
      // Fase 1: Busca artigos (rápido — Semantic Scholar)
      const langParam = options?.lang ? `&lang=${encodeURIComponent(options.lang)}` : "";
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}${langParam}`);

      if (!searchRes.ok) throw new Error("API de busca indisponível");

      const { count, articles, sources } = await searchRes.json();
      if (Array.isArray(sources)) setRealSources(sources);

      // ICM provisório calculado localmente enquanto a síntese IA carrega
      const STUDY_SCORES: Record<string, number> = {
        "meta-análise": 100, "revisão sistemática": 85,
        "ensaio clínico randomizado": 75, "coorte": 65,
        "estudo observacional": 50, "preprint": 30, "revisão narrativa": 40,
      };
      const SOURCE_SCORES: Record<string, number> = {
        "Cochrane": 95, "PubMed": 90, "Semantic Scholar": 85,
        "OpenAlex": 80, "CrossRef": 80, "DOAJ": 75, "SciELO": 75,
        "Europe PMC": 75, "BVS/LILACS": 70, "CORE": 70, "BASE": 65, "arXiv": 55,
      };
      const top8 = (articles as { study_type: string; source: string; citations: number; year: string }[]).slice(0, 8);
      const provisionalICM = top8.length > 0
        ? (() => {
            const base = top8.reduce((sum, a) => {
              const ts = STUDY_SCORES[a.study_type] ?? 50;
              const ss = SOURCE_SCORES[a.source] ?? 65;
              const pb = ts >= 65 ? 10 : 0;
              const citW = Math.min(100, Math.floor((a.citations ?? 0) / 2));
              const yr = parseInt(a.year) || 2000;
              const yearW = yr >= 2023 ? 100 : yr >= 2020 ? 90 : yr >= 2018 ? 80 : yr >= 2015 ? 60 : yr >= 2010 ? 40 : 20;
              return sum + ts * 0.35 + ss * 0.25 + pb * 0.20 + citW * 0.15 + yearW * 0.05;
            }, 0) / top8.length;
            const uniqueSources = new Set(top8.map(a => a.source)).size;
            const diversityBonus = Math.min(15, (uniqueSources - 1) * 4);
            return Math.min(95, Math.max(30, Math.round(base + diversityBonus)));
          })()
        : 60;

      // Mostrar artigos imediatamente com síntese provisória
      setResult({
        keywords: [searchTerm],
        count: count ?? articles.length,
        articles,
        synthesis: {
          direct_answer: "",
          consensus_agree: 0,
          consensus_inconclusive: 100,
          consensus_contradict: 0,
          confidence_level: provisionalICM >= 70 ? "alta" : provisionalICM >= 55 ? "média" : "limitada",
          confidence_score: provisionalICM,
          confidence_reasons: [],
          inconclusive_summary: "",
          contradict_explanation: "",
          practical_insight: "",
          search_tip: "",
          maturity_label: "Evidência emergente",
        },
      });
      setLoading(false);
      setSynthesisLoading(true);

      // Fase 2: Síntese por IA (pode demorar — LLM)
      const sumRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm, articles }),
      });

      let synthesis;
      let failed = false;
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        synthesis = sumData.synthesis;
      } else {
        failed = true;
        // Síntese mínima — sem texto genérico que polui o painel
        synthesis = {
          direct_answer: "",
          consensus_agree: 0,
          consensus_inconclusive: 100,
          consensus_contradict: 0,
          confidence_level: "média",
          confidence_score: 60,
          confidence_reasons: [],
          inconclusive_summary: "",
          contradict_explanation: "",
          practical_insight: "",
          search_tip: "",
          maturity_label: undefined,
        };
      }
      setSynthesisFailed(failed);

      setResult((prev) => prev ? { ...prev, synthesis } : prev);
    } catch (err) {
      console.warn("[handleSearch] API indisponível:", err);
      setLoading(false);
      setSearchError("Não foi possível conectar à base de dados. Verifique sua conexão e tente novamente.");
    } finally {
      setSynthesisLoading(false);
      await decrementSearch();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSearch(query);
  };

  const handleBack = () => {
    setResult(null);
    setQuery("");
    setSynthesisLoading(false);
    setSynthesisFailed(false);
  };

  // ── RESULTS VIEW ──
  if (result && !loading) {
    return (
      <ResultsView
        query={query}
        result={result}
        searchesLeft={searchesLeft}
        onQueryChange={setQuery}
        onSubmit={handleSubmit}
        onSearch={handleSearch}
        onBack={handleBack}
        synthesisLoading={synthesisLoading}
        synthesisFailed={synthesisFailed}
        theme={theme}
        onToggleTheme={toggleTheme}
        realSources={realSources}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* HEADER */}
      <header className="relative border-b border-foreground/10">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <BrainCircuit className="text-primary size-6 shrink-0" />
            <button onClick={handleBack} aria-label="Voltar para o início" className="flex items-center">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Clar<span className="text-primary">a</span>
              </h1>
            </button>
            <span className="bg-foreground/10 text-xs font-bold px-2 py-0.5 rounded text-primary">
              BETA
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/fontes"
              className="border border-foreground/20 px-4 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
            >
              Nossas Fontes
            </Link>
            <div className={`border px-4 py-1.5 rounded-lg text-sm font-semibold ${
              searchesLeft === 0
                ? "border-rose-500/40 text-rose-400"
                : "border-foreground/20 text-primary"
            }`}>
              {searchesLeft} buscas
            </div>
            <button
              onClick={() => setShowPlans(true)}
              className="border border-foreground/20 px-4 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
            >
              Planos
            </button>
            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground border border-foreground/10 px-3 py-1.5 rounded-lg">
                  <UserCircle size={14} className="text-primary" />
                  {user.email.split("@")[0]}
                </span>
                <button
                  onClick={() => void signOut()}
                  title="Sair"
                  className="border border-foreground/20 p-2 rounded-lg text-foreground/60 hover:text-rose-400 hover:border-rose-400/30 transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : isSupabaseConfigured ? (
              <button
                onClick={() => { setAuthReason("default"); setShowAuth(true); }}
                className="flex items-center gap-1.5 border border-primary/30 bg-primary/5 text-primary px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/10 transition-colors"
              >
                <LogIn size={14} /> Entrar
              </button>
            ) : null}
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
              className="border border-foreground/20 p-2 rounded-lg text-foreground/60 hover:text-primary hover:border-primary/30 transition-colors"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
              className="border border-foreground/20 p-2 rounded-lg text-foreground/60"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Menu"
              className="border border-foreground/20 p-2 rounded-lg text-foreground/60"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-foreground/10 bg-background px-4 py-3 space-y-2">
            <Link
              to="/fontes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-foreground/10 text-sm font-medium text-foreground/80"
            >
              <BookOpen size={15} className="text-primary" /> Nossas Fontes
            </Link>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-foreground/10 text-sm text-primary font-semibold">
              <BrainCircuit size={15} /> {searchesLeft} buscas restantes
            </div>
            <button
              onClick={() => { setShowPlans(true); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-foreground/10 text-sm font-medium text-foreground/80"
            >
              <Zap size={15} className="text-primary" /> Ver planos
            </button>
          </div>
        )}
      </header>

      <PlansModal
        open={showPlans}
        onClose={() => setShowPlans(false)}
        userId={user?.id}
        userEmail={user?.email}
      />
      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        reason={authReason}
      />

      {/* HERO SECTION */}
      <main className="flex flex-col items-center">
        <HeroSection
          query={query}
          setQuery={setQuery}
          handleSubmit={handleSubmit}
          handleSearch={handleSearch}
          loading={loading}
          searchError={searchError}
          searchesLeft={searchesLeft}
          setShowPlans={setShowPlans}
        />

        {!loading && (
          <>
            <HowItWorksSection />
            <WhyClaraSection />
            <FeaturesSection />
            <CtaSection searchesLeft={searchesLeft} />
          </>
        )}

      </main>

      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowFeedback(true)}
        aria-label="Feedback e suporte"
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:brightness-110 active:scale-[0.95] transition-all z-50"
      >
        <MessageSquarePlus size={24} />
      </button>
    </div>
  );
};

export default Index;

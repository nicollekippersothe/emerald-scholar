import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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
  { icon: Database, title: "Principais bases científicas", desc: "PubMed, Semantic Scholar, Cochrane, SciELO, arXiv e mais — publicações indexadas nas fontes mais relevantes da ciência." },
  { icon: BarChart3, title: "Consenso científico", desc: "Percentual de estudos que concordam, são inconclusivos ou contradizem." },
  { icon: Gauge, title: "Índice de confiança", desc: "Pondera cada estudo pelo tipo e citações. Meta-análises pesam mais." },
  { icon: FileText, title: "Referência ABNT", desc: "Gerada automaticamente. Copiável com um clique." },
  { icon: Link2, title: "DOI verificável", desc: "Link direto para o artigo oficial antes de citar." },
  { icon: FileSearch, title: "Dissecar PDF", desc: "Em breve: envie qualquer artigo e receba objetivo, amostra, p-valor e limitações." },
];

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

      const { count, articles } = await searchRes.json();

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
          confidence_level: "média",
          confidence_score: 60,
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
                Scholar<span className="text-primary">IA</span>
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
        <section className="w-full bg-gradient-to-b from-background via-background to-background/80 px-6 pt-16 pb-12 flex flex-col items-center">
          <div className="bg-foreground/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 mb-6 border border-foreground/5">
            <BookOpen size={16} /> PARA PESQUISA ACADÊMICA
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 leading-tight text-center">
            Seu assistente de <br />
            <span className="text-primary italic">pesquisa científica</span>
          </h2>

          <p className="text-foreground/70 text-lg mb-10 max-w-2xl text-center">
            Inclui publicações de PubMed, Cochrane, SciELO, arXiv e outras — filtra os artigos revisados por
            especialistas e mostra o nível de confiabilidade de cada fonte.
          </p>

          {/* SEARCH CARD */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl bg-card/60 border border-foreground/10 rounded-2xl p-5 mb-6 shadow-2xl"
          >
            <div className="relative mb-3">
              <BrainCircuit className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Impacto da microbiota intestinal na saúde mental: uma revisão sistemática"
                className="w-full py-3 pl-12 pr-10 rounded-xl bg-background/50 border border-foreground/10 text-base placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-base hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Buscar e analisar <ArrowRight size={18} />
            </button>
          </form>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-12 flex flex-col items-center gap-4 text-primary font-bold animate-pulse text-xl">
              <BrainCircuit className="size-12 animate-spin" />
              Analisando bases científicas...
            </div>
          )}

          {/* ERROR */}
          {searchError && !loading && (
            <div className="text-center py-8 flex flex-col items-center gap-2 text-destructive">
              <p className="font-semibold">{searchError}</p>
            </div>
          )}

          {/* Info line */}
          {!loading && (
            <>
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
                <span>{searchesLeft} buscas gratuitas, sem cadastro</span>
                <button onClick={() => setShowPlans(true)} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <BotMessageSquare size={16} /> Analisar um PDF
                </button>
              </div>

              {/* SOURCE BADGES */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-2xl">
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
                    className="bg-card/50 border border-foreground/10 hover:border-primary/30 px-5 py-2.5 rounded-full text-sm text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* FEATURES SECTION */}
        {!loading && (
          <section className="w-full bg-foreground/[0.03] border-t border-foreground/5 px-6 py-20">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-extrabold text-foreground text-center mb-3">
                Uma ferramenta feita para quem pesquisa de verdade
              </h3>
              <p className="text-foreground/60 text-center mb-12 max-w-xl mx-auto">
                Cada resultado vem com contexto suficiente para você avaliar, citar e
                seguir em frente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.title}
                    className={`bg-card/40 border border-foreground/5 rounded-2xl p-5 hover:border-primary/20 transition-colors ${
                      i >= 4 ? "sm:col-span-1" : ""
                    }`}
                  >
                    <f.icon className="text-primary mb-3" size={22} />
                    <h4 className="font-bold text-foreground text-sm mb-1">{f.title}</h4>
                    <p className="text-foreground/50 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA SECTION */}
        {!loading && (
          <section className="w-full bg-gradient-to-b from-background to-background px-6 py-16">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-2xl font-extrabold text-foreground italic mb-3">
                Comece agora
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                3 buscas gratuitas. Sem cadastro.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:brightness-110 active:scale-[0.97] transition-all inline-flex items-center gap-2"
              >
                Buscar artigos <ArrowRight size={18} />
              </button>
            </div>
          </section>
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

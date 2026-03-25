import { useState, type FormEvent } from "react";
import {
  BookOpen,
  BrainCircuit,
  ArrowRight,
  BotMessageSquare,
  Bot,
  X,
  Search,
  Database,
  BarChart3,
  Gauge,
  FileText,
  Link2,
  FileSearch,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { findMatch, type MockEntry } from "@/data/mockDatabase";
import ResultsView from "@/components/ResultsView";
import PlansModal from "@/components/PlansModal";

const SC_BADGES = [
  { name: "PubMed", color: "#EF4444" },
  { name: "OpenAlex", color: "#3B82F6" },
  { name: "Semantic Scholar", color: "#A78BFA" },
  { name: "CrossRef", color: "#2DD4BF" },
  { name: "DOAJ", color: "#38BDF8" },
  { name: "SciELO", color: "#22C55E" },
  { name: "arXiv", color: "#F97316" },
  { name: "Europe PMC", color: "#E11D48" },
  { name: "BASE", color: "#8B5CF6" },
  { name: "Lens.org", color: "#06B6D4" },
  { name: "CORE", color: "#D97706" },
];

const QUICK_SEARCHES = [
  "retinol reduz linhas finas em adultos?",
  "exercício aeróbico melhora depressão clínica?",
  "sono fragmentado aumenta risco de Alzheimer?",
  "meditação mindfulness reduz ansiedade?",
  "probióticos melhoram saúde intestinal?",
  "redes sociais causam vício em dopamina?",
];

const FEATURES = [
  { icon: Database, title: "11 bases simultâneas", desc: "PubMed, OpenAlex, Semantic Scholar, CrossRef, DOAJ, SciELO, arXiv, Europe PMC, BASE, Lens.org e CORE." },
  { icon: BarChart3, title: "Consenso científico", desc: "Percentual de estudos que concordam, são inconclusivos ou contradizem." },
  { icon: Gauge, title: "Índice de confiança", desc: "Pondera cada estudo pelo tipo e citações. Meta-análises pesam mais." },
  { icon: FileText, title: "Referência ABNT", desc: "Gerada automaticamente. Copiável com um clique." },
  { icon: Link2, title: "DOI verificável", desc: "Link direto para o artigo oficial antes de citar." },
  { icon: FileSearch, title: "Dissecar PDF", desc: "Envie qualquer artigo e receba objetivo, amostra, p-valor e limitações." },
];

const Index = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<MockEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchesLeft, setSearchesLeft] = useState(3);
  const [showPlans, setShowPlans] = useState(false);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setQuery(searchTerm);
    setTimeout(() => {
      setResult(findMatch(searchTerm));
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-primary size-6" />
          <button onClick={handleBack} className="flex items-center">
            <h1 className="text-xl font-extrabold tracking-tight">
              Scholar<span className="text-primary">IA</span>
            </h1>
          </button>
          <span className="bg-foreground/10 text-xs font-bold px-2 py-0.5 rounded text-primary">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-foreground/20 text-primary px-4 py-1.5 rounded-lg text-sm font-semibold">
            {searchesLeft} buscas restantes
          </div>
          <button
            onClick={() => setShowPlans(true)}
            className="border border-foreground/20 px-4 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
          >
            Planos
          </button>
        </div>
      </header>

      <PlansModal open={showPlans} onClose={() => setShowPlans(false)} />

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
            Busca em 11 bases simultâneas, filtra os artigos revisados por
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
                placeholder="existe telepatia?"
                className="w-full py-3 pl-12 pr-10 rounded-xl bg-background/50 border border-foreground/10 text-base placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
              />
              {query && (
                <button
                  type="button"
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

          {/* Info line */}
          {!loading && (
            <>
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
                <span>{searchesLeft} buscas gratuitas, sem cadastro</span>
                <button className="flex items-center gap-2 hover:text-foreground transition-colors">
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

        {/* SPLIT PDF SECTION */}
        {!loading && (
          <section className="w-full px-6 pb-20">
            <div className="max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-[hsl(160,82%,11%)] to-[hsl(160,60%,16%)] rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Left */}
                <div className="p-8 md:p-10">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 mb-4">
                    <FileSearch size={14} /> SPLIT PDF
                  </span>
                  <h4 className="text-2xl font-extrabold text-white mb-1">
                    Já tem um artigo
                  </h4>
                  <h4 className="text-2xl font-extrabold text-primary italic mb-4">
                    em mãos?
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">
                    Envie o PDF e a IA divide em blocos de fatos puros: objetivo,
                    amostra, resultado principal, p-valor, conflito de interesse e
                    limitações até as que os autores não declararam.
                  </p>
                  <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all inline-flex items-center gap-2">
                    Dissecar artigo <ArrowRight size={16} />
                  </button>
                </div>
                {/* Right */}
                <div className="p-8 md:p-10 flex flex-col justify-center gap-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="text-primary shrink-0 mt-0.5" size={18} />
                    <div>
                      <h5 className="font-bold text-white text-sm">Resultado principal</h5>
                      <p className="text-white/50 text-xs">
                        O que foi encontrado, se é estatisticamente significativo (p-valor) e o tamanho real do efeito.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h5 className="font-bold text-white text-sm">Limitações não declaradas</h5>
                      <p className="text-white/50 text-xs">
                        Problemas que os próprios autores não mencionaram.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h5 className="font-bold text-white text-sm">Financiamento e viés</h5>
                      <p className="text-white/50 text-xs">
                        Quem financiou o estudo? Há conflito de interesse?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
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

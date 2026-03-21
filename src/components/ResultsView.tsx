import { type FormEvent, useState } from "react";
import {
  BrainCircuit,
  ArrowRight,
  Search,
  Target,
  Lightbulb,
  Zap,
  Clock,
  Bot,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  BookOpen,
  FileText,
  ClipboardCheck,
  FileSearch,
  X,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { type MockEntry, type Article, STUDY_TYPE_MAP, EVIDENCE_LABELS } from "@/data/mockDatabase";

const SC_BADGES = [
  { name: "PubMed", color: "#EF4444" },
  { name: "OpenAlex", color: "#3B82F6" },
  { name: "Semantic Scholar", color: "#A78BFA" },
  { name: "CrossRef", color: "#2DD4BF" },
  { name: "DOAJ", color: "#38BDF8" },
  { name: "SciELO", color: "#22C55E" },
  { name: "arXiv", color: "#F97316" },
];

const TABS = [
  { id: "search", label: "Pesquisar", icon: Search, count: null },
  { id: "analysis", label: "Análises", icon: Zap, count: null },
  { id: "references", label: "Referências", icon: FileText, count: null },
  { id: "audit", label: "Auditoria", icon: ClipboardCheck, count: 1 },
  { id: "split", label: "Split PDF", icon: FileSearch, count: null },
];

interface ResultsViewProps {
  query: string;
  result: MockEntry;
  searchesLeft: number;
  onQueryChange: (q: string) => void;
  onSubmit: (e: FormEvent) => void;
  onSearch: (term: string) => void;
  onBack: () => void;
}

/* ── Score dots ── */
const ScoreDots = ({ score }: { score: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className={`w-2.5 h-2.5 rounded-full ${
          i <= score ? "bg-primary" : "bg-foreground/10"
        }`}
      />
    ))}
    <span className="text-xs font-bold text-foreground/70 ml-1.5">
      {score}/5 · {EVIDENCE_LABELS[score] || "N/A"}
    </span>
  </div>
);

/* ── Article Card ── */
const ArticleCard = ({ article, onSave, saved }: { article: Article; onSave: () => void; saved: boolean }) => {
  const [copiedAbnt, setCopiedAbnt] = useState(false);
  const studyInfo = STUDY_TYPE_MAP[article.study_type] || { icon: "📄", label: article.study_type };

  const copyAbnt = () => {
    navigator.clipboard?.writeText(article.abnt);
    setCopiedAbnt(true);
    setTimeout(() => setCopiedAbnt(false), 2000);
  };

  return (
    <div className="bg-card/40 border border-foreground/5 rounded-2xl p-5 hover:border-primary/20 transition-all">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{article.year}</span>
          <span>{article.journal}</span>
          <span style={{ color: SC_BADGES.find(s => s.name === article.source)?.color }}>
            via {article.source}
          </span>
          {article.is_oa && (
            <span className="text-primary text-[10px] font-bold">🔓 Acesso aberto</span>
          )}
        </div>
        <button
          onClick={onSave}
          className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors ${
            saved
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-foreground/10 text-muted-foreground hover:border-primary/20"
          }`}
        >
          {saved ? "✓ Salvo" : "Salvar"}
        </button>
      </div>

      {/* Title */}
      <h4 className="font-bold text-foreground leading-tight mb-1">{article.title}</h4>
      <p className="text-xs text-muted-foreground mb-3">
        {article.authors} · {article.citations > 0 ? `${article.citations.toLocaleString()} citações` : ""}
      </p>

      {/* Score */}
      <div className="mb-3">
        <ScoreDots score={article.evidence_score} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {article.expert_reviewed && (
          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-semibold">
            ✓ Avaliado por especialistas
          </span>
        )}
        <span className="bg-foreground/5 text-foreground/60 border border-foreground/10 px-2 py-0.5 rounded text-[10px] font-semibold">
          {studyInfo.icon} {studyInfo.label}
        </span>
        {article.citations > 0 && (
          <span className="bg-foreground/5 text-foreground/60 border border-foreground/10 px-2 py-0.5 rounded text-[10px] font-semibold">
            📎 {article.citations.toLocaleString()} citações
          </span>
        )}
      </div>

      {/* Tabs: Simples / Técnico */}
      <div className="mb-3">
        <div className="flex gap-2 mb-2">
          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded text-[10px] font-bold">💬 Simples</span>
          <span className="bg-foreground/5 text-muted-foreground px-2.5 py-1 rounded text-[10px] font-bold">🔬 Técnico</span>
        </div>
        <div className="bg-background/60 p-4 rounded-xl text-sm text-foreground/80 italic border border-foreground/5 leading-relaxed">
          "{article.abstract_pt}"
        </div>
      </div>

      {/* Bias warning */}
      {article.potential_bias && article.potential_bias !== "Nenhum identificado" && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>Conflito ou viés: {article.potential_bias}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={`https://doi.org/${article.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground/5 text-foreground/70 border border-foreground/10 hover:border-primary/20 transition-colors"
        >
          <ExternalLink size={12} /> Ver artigo
        </a>
        <button
          onClick={copyAbnt}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground/5 text-foreground/70 border border-foreground/10 hover:border-primary/20 transition-colors"
        >
          {copiedAbnt ? <Check size={12} /> : <Copy size={12} />}
          {copiedAbnt ? "Copiado!" : "ABNT"}
        </button>
      </div>
    </div>
  );
};

/* ── Main ResultsView ── */
const ResultsView = ({
  query,
  result,
  searchesLeft,
  onQueryChange,
  onSubmit,
  onSearch,
  onBack,
}: ResultsViewProps) => {
  const [activeTab, setActiveTab] = useState("search");
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("Todas");

  const toggleSave = (title: string) => {
    setSavedArticles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const filteredArticles = result.articles.filter((a) => {
    if (scoreFilter > 0 && a.evidence_score < scoreFilter) return false;
    if (sourceFilter !== "Todas" && a.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-primary size-6" />
          <button onClick={onBack} className="flex items-center">
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
          <button className="border border-foreground/20 px-4 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
            Planos
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-6">
        {/* TIPS BAR */}
        <div className="bg-card/60 border border-foreground/5 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-primary font-bold flex items-center gap-1.5 mb-1">
              💡 COMO OBTER MELHORES RESULTADOS
            </span>
            <span className="text-muted-foreground">
              Perguntas específicas com causa e efeito trazem muito mais artigos relevantes.
            </span>
          </div>
          <div>
            <span className="text-rose-400 font-bold flex items-center gap-1.5 mb-1">
              ✗ EVITE
            </span>
            <span className="text-muted-foreground">
              benefícios do açafrão<br />chá é saudável?
            </span>
          </div>
          <div>
            <span className="text-primary font-bold flex items-center gap-1.5 mb-1">
              ✓ PREFIRA
            </span>
            <span className="text-muted-foreground">
              açafrão reduz depressão em adultos?<br />sono fragmentado causa Alzheimer?
            </span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={onSubmit} className="w-full bg-card/60 border border-foreground/10 rounded-2xl p-4 mb-4 shadow-lg">
          <div className="relative mb-3">
            <BrainCircuit className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full py-3 pl-12 pr-10 rounded-xl bg-background/50 border border-foreground/10 text-base placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-base hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Buscar e analisar artigos <ArrowRight size={18} />
          </button>
        </form>

        {/* TABS */}
        <div className="flex items-center gap-1 bg-card/40 border border-foreground/5 rounded-2xl p-1.5 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-foreground/10"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* CONSENSUS PANEL */}
        <div className="bg-gradient-to-br from-[hsl(160,82%,11%)] to-[hsl(160,60%,16%)] rounded-3xl p-6 md:p-8 border border-foreground/5 shadow-2xl mb-6">
          <div className="mb-1">
            <span className="text-primary/80 text-[10px] font-bold uppercase tracking-widest">
              INTERPRETAÇÃO COM BASE EM {result.count} ESTUDOS CIENTÍFICOS
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-4">
            "{query}"
          </h3>

          {/* Source badges */}
          <div className="flex gap-1.5 mb-5">
            {["PubMed", "OpenAlex", "Semantic Scholar"].map((name) => {
              const badge = SC_BADGES.find((b) => b.name === name);
              return (
                <span
                  key={name}
                  style={{ backgroundColor: `${badge?.color}20`, color: badge?.color, borderColor: `${badge?.color}30` }}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                >
                  {name}
                </span>
              );
            })}
          </div>

          {/* Direct answer */}
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 mb-6">
            <p className="text-sm text-white/90 leading-relaxed">
              {result.synthesis.direct_answer}
            </p>
          </div>

          {/* Horizontal consensus bars */}
          <div className="space-y-2.5 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-white/70 w-36 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" /> Estudos concordam
              </span>
              <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${result.synthesis.consensus_agree}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-400 w-10 text-right">
                {result.synthesis.consensus_agree}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-white/70 w-36 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-400" /> Inconclusivo
              </span>
              <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${result.synthesis.consensus_inconclusive}%` }}
                />
              </div>
              <span className="text-xs font-bold text-amber-400 w-10 text-right">
                {result.synthesis.consensus_inconclusive}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-white/70 w-36 flex items-center gap-1.5">
                <XCircle size={13} className="text-rose-400" /> Contradizem
              </span>
              <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400"
                  style={{ width: `${result.synthesis.consensus_contradict}%` }}
                />
              </div>
              <span className="text-xs font-bold text-rose-400 w-10 text-right">
                {result.synthesis.consensus_contradict}%
              </span>
            </div>
          </div>

          {/* ICM Score */}
          <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-2xl font-black text-white">8.3</span>
                <span className="text-xs text-white/50 ml-1">/10</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                  ÍNDICE DE CONFIANÇA METODOLÓGICA (ICM)
                </span>
                <p className="text-xs text-white/50">
                  <span className="font-bold text-white/80">Muito forte</span> — baseado no tipo e citações dos estudos
                </p>
              </div>
            </div>
          </div>

          {/* Confidence + Insight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 block">
                NÍVEL DE CONFIANÇA
              </span>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-white capitalize">
                  {result.synthesis.confidence_level}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-sm ${
                        i <= (result.synthesis.confidence_level === "alta" ? 5 : result.synthesis.confidence_level === "média" ? 3 : 1)
                          ? "bg-primary"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {result.synthesis.confidence_reasons?.map((r, i) => (
                <p key={i} className="text-[11px] text-white/50 leading-relaxed">
                  · {r}
                </p>
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1.5">
                💡 INSIGHT PRÁTICO
              </span>
              <p className="text-sm text-white/80 leading-relaxed">
                {result.synthesis.practical_insight}
              </p>
            </div>
          </div>
        </div>

        {/* AI WARNING */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-6">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Resumos e metadados são gerados por IA e podem conter imprecisões. Verifique o artigo original antes de citar.
          </span>
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-3 flex-wrap mb-3 text-xs">
          <span className="text-muted-foreground font-semibold">
            {result.articles.length} artigos
          </span>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            <input type="checkbox" className="rounded accent-primary" /> Avaliados por especialistas
          </label>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            <input type="checkbox" className="rounded accent-primary" /> Acesso aberto
          </label>
          <span className="text-muted-foreground">Nota mín.</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setScoreFilter(scoreFilter === n ? 0 : n)}
                className={`w-7 h-7 rounded text-[11px] font-bold border transition-colors ${
                  scoreFilter === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-foreground/10 text-muted-foreground hover:border-primary/30"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Source filter badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-6">
          <button
            onClick={() => setSourceFilter("Todas")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              sourceFilter === "Todas"
                ? "bg-foreground text-background border-foreground"
                : "border-foreground/10 text-muted-foreground"
            }`}
          >
            Todas
          </button>
          {SC_BADGES.map((sc) => (
            <button
              key={sc.name}
              onClick={() => setSourceFilter(sourceFilter === sc.name ? "Todas" : sc.name)}
              style={{
                backgroundColor: sourceFilter === sc.name ? `${sc.color}20` : undefined,
                color: sourceFilter === sc.name ? sc.color : undefined,
                borderColor: sourceFilter === sc.name ? `${sc.color}30` : undefined,
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                sourceFilter === sc.name ? "" : "border-foreground/10 text-muted-foreground"
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>

        {/* VERIFICATION GUIDE */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card/40 border border-foreground/5 mb-6 text-xs">
          <Info size={14} className="text-primary shrink-0" />
          <span className="font-bold text-foreground">Como verificar um artigo antes de citar</span>
          <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">
            ⚠️ IA pode errar
          </span>
        </div>

        {/* ARTICLES */}
        <div className="space-y-4">
          {filteredArticles.map((art, i) => (
            <ArticleCard
              key={i}
              article={art}
              saved={savedArticles.includes(art.title)}
              onSave={() => toggleSave(art.title)}
            />
          ))}
        </div>
      </main>

      {/* Floating Bot */}
      <button className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:brightness-110 active:scale-[0.95] transition-all z-50">
        <Bot size={24} />
      </button>
    </div>
  );
};

export default ResultsView;

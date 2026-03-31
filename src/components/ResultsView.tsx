import { type FormEvent, useState, useRef, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import {
  BrainCircuit,
  ArrowRight,
  Search,
  Zap,
  Bot,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  BookOpen,
  FileText,
  FileSearch,
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Download,
  BarChart3,
  Link2,
  MessageCircle,
  MessageSquarePlus,
  Loader2,
  Bookmark,
  Sun,
  Moon,
  FlaskConical,
  Lightbulb,
} from "lucide-react";
import PlansModal from "@/components/PlansModal";
import FeedbackModal from "@/components/FeedbackModal";
import DevModal from "@/components/DevModal";
import PromoCodeModal from "@/components/PromoCodeModal";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import SynthesisPanel from "@/components/SynthesisPanel";
import { useQueryIntention } from "@/hooks/useQueryIntention";
import { type MockEntry, type Article, type ArticleSummary, STUDY_TYPE_MAP, EVIDENCE_LABELS, CONFIDENCE_EXPLANATIONS, SOURCE_LIST } from "@/data/mockDatabase";

const SC_BADGES = [
  { name: "PubMed", color: "#EF4444" },
  { name: "Semantic Scholar", color: "#A78BFA" },
  { name: "Cochrane", color: "#7C3AED" },
  { name: "SciELO", color: "#22C55E" },
  { name: "arXiv", color: "#F97316" },
];

const TABS = [
  { id: "search", label: "Pesquisar", icon: Search, count: null },
  { id: "analysis", label: "Análises", icon: BarChart3, count: null },
  { id: "references", label: "Referências", icon: FileText, count: null },
  { id: "split", label: "Split PDF", icon: FileSearch, count: null },
  { id: "saved", label: "Meus Salvos", icon: Bookmark, count: null },
];

const VERIFICATION_STEPS = [
  { n: 1, icon: "🔗", title: "Acesse o DOI ou link do artigo", desc: "Confirme que o artigo existe e que título, autores e ano batem com o que aparece aqui. DOIs falsos ou incorretos são um dos erros mais comuns de IA." },
  { n: 2, icon: "📋", title: "Confira a referência ABNT gerada", desc: "Compare cada campo (autores, título, periódico, volume, páginas, ano) com o artigo original. A IA pode inverter nomes, errar volumes ou inventar páginas." },
  { n: 3, icon: "🔍", title: "Verifique o periódico no Qualis CAPES", desc: "Acesse sucupira.capes.gov.br e confira a classificação do periódico para sua área (A1 a C). Periódicos predatórios podem aparecer nos resultados." },
  { n: 4, icon: "📖", title: "Leia o abstract original", desc: "O resumo em português é uma tradução/simplificação feita por IA. Sempre leia o abstract original em inglês no site do periódico antes de citar em trabalho acadêmico." },
];

const QUICK_QUESTIONS = [
  "Explica este estudo de forma simples",
  "Quais são as limitações?",
  "Esta fonte é confiável para citar?",
  "Como verificar este artigo?",
];

interface ResultsViewProps {
  query: string;
  result: MockEntry;
  searchesLeft: number;
  onQueryChange: (q: string) => void;
  onSubmit: (e: FormEvent) => void;
  onSearch: (term: string, options?: { lang?: string }) => void;
  onBack: () => void;
  synthesisLoading?: boolean;
  synthesisFailed?: boolean;
  theme?: string;
  onToggleTheme?: () => void;
}

/* ── Hallucination-filtered chat answer ── */
const getContextualAnswer = (q: string, article: Article): string => {
  const abstract = article.abstract_pt || "";
  const ql = q.toLowerCase();

  // Quick questions with abstract-grounded answers
  if (ql.includes("explica") || ql.includes("simples") || ql.includes("resumo")) {
    return `Com base no resumo disponível: Este é um ${article.study_type || "estudo"} de ${article.year}, publicado em ${article.journal}. ${abstract}`;
  }
  if (ql.includes("limitaç") || ql.includes("limitação") || ql.includes("limite")) {
    const parts: string[] = [];
    if (article.evidence_reason) parts.push(`Avaliação de evidência: ${article.evidence_reason}`);
    if (article.potential_bias && article.potential_bias !== "Nenhum identificado") parts.push(`Viés identificado: ${article.potential_bias}`);
    if (parts.length === 0) parts.push("O resumo disponível não detalha limitações específicas. Consulte o artigo completo via DOI para a seção de limitações.");
    return parts.join(" ");
  }
  if (ql.includes("confiável") || ql.includes("citar") || ql.includes("fonte")) {
    return `Avaliação para citação: Score de evidência ${article.evidence_score}/5 (${EVIDENCE_LABELS[article.evidence_score] || "N/A"}). ${article.expert_reviewed ? "✓ Avaliado por pares." : "⚠️ Não avaliado por pares — use com cautela."} ${article.citations > 0 ? `${article.citations.toLocaleString()} citações.` : ""} Publicado em ${article.journal} (${article.year}). ⚠️ Sempre confirme pelo DOI antes de citar.`;
  }
  if (ql.includes("verificar") || ql.includes("checar") || ql.includes("conferir")) {
    return `Para verificar: 1) Acesse doi.org/${article.doi || "[consulte o DOI]"} e confirme que título e autores batem. 2) Leia o abstract original em inglês. 3) Confira o periódico "${article.journal}" no Qualis CAPES. 4) Compare a referência ABNT gerada com os dados do artigo original.`;
  }

  // Free-form: try to answer from abstract
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const relevant = words.some(w => abstract.toLowerCase().includes(w));
  
  if (relevant) {
    return `Com base no resumo disponível deste artigo: ${abstract}\n\n⚠️ Esta resposta é baseada exclusivamente no resumo. Para informações mais detalhadas, consulte o artigo completo via DOI.`;
  }

  return `⚠️ Esta informação específica não consta no resumo disponível deste artigo. O resumo aborda: "${abstract.substring(0, 150)}..." Para obter essa informação, acesse o artigo completo em doi.org/${article.doi || "[DOI]"}.`;
};

/* ── Score dots ── */
const ScoreDots = ({ score }: { score: number }) => (
  <div
    className="flex items-center gap-1 cursor-help"
    title={`Evidência ${score}/5: 1=Opinião · 2=Caso clínico · 3=Coorte/Observacional · 4=Revisão sistemática · 5=Meta-análise`}
  >
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className={`w-3 h-3 rounded-full ${
          i <= score ? "bg-primary" : "bg-foreground/10"
        }`}
      />
    ))}
    <span className="text-xs font-bold text-foreground/70 ml-1.5">
      {score}/5 · {EVIDENCE_LABELS[score] || "N/A"}
    </span>
  </div>
);

/* ── Evidence level badge colors ── */
const EVIDENCE_BADGE_CONFIG: Record<string, string> = {
  "Meta-análise":                  "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-400/30",
  "Revisão Sistemática":           "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/30",
  "Ensaio Clínico Randomizado":    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30",
  "Estudo de Coorte":              "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30",
  "Estudo Transversal":            "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/30",
  "Estudo Caso-Controle":          "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-400/30",
  "Preprint não revisado":         "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30",
  "Revisão Narrativa":             "bg-muted text-muted-foreground border-border",
  "Estudo Observacional":          "bg-muted text-muted-foreground border-border",
  "Relato de Caso":                "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30",
};

/* ── Article Card with Chat ── */
const ArticleCard = memo(({ article, onSave, saved, resumoPt, articleSummary, query }: {
  article: Article;
  onSave: () => void;
  saved: boolean;
  resumoPt?: string;
  articleSummary?: ArticleSummary;
  query?: string;
}) => {
  const [copiedAbnt, setCopiedAbnt] = useState(false);
  const [showAbnt, setShowAbnt] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [expandedAbstract, setExpandedAbstract] = useState(false);
  const [summaryTab, setSummaryTab] = useState<"popular" | "tecnico">("popular");
  const [msgs, setMsgs] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const studyInfo = STUDY_TYPE_MAP[article.study_type] || { icon: "📄", label: article.study_type };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const copyAbnt = () => {
    navigator.clipboard?.writeText(article.abnt);
    setCopiedAbnt(true);
    setTimeout(() => setCopiedAbnt(false), 2000);
  };

  const sendMessage = async (q?: string) => {
    const m = (q || chatInput).trim();
    if (!m) return;
    setChatInput("");
    setMsgs((prev) => [...prev, { role: "user", text: m }]);
    setChatLoading(true);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
    setMsgs((prev) => [...prev, { role: "ai", text: getContextualAnswer(m, article) }]);
    setChatLoading(false);
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
      <div className="flex items-start gap-2 mb-1">
        <h4 className="font-bold text-foreground leading-tight line-clamp-2 flex-1">{article.title}</h4>
        <a
          href={`https://translate.google.com/?sl=auto&tl=pt-BR&text=${encodeURIComponent(article.title)}&op=translate`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 mt-0.5 text-muted-foreground/50 hover:text-primary transition-colors"
          title="Ver título em português"
        >
          <ExternalLink size={12} />
        </a>
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
        {article.authors}{article.citations > 0 ? ` · ${article.citations.toLocaleString()} citações` : ""}
      </p>

      {/* Score */}
      <div className="mb-3 space-y-2">
        <ScoreDots score={article.evidence_score} />
        <ConfidenceBadge score={article.confidence_score} factors={article.confidence_factors} />
      </div>

      {/* Why this score */}
      {article.evidence_reason && (
        <div className="mb-3 p-3 rounded-xl bg-foreground/[0.03] border border-foreground/5 text-xs text-foreground/60">
          <span className="font-semibold text-foreground/80">Por que {EVIDENCE_LABELS[article.evidence_score]}?</span>{" "}
          {article.evidence_reason}
        </div>
      )}

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

      {/* Evidence level badge (from AI article_summaries) */}
      {articleSummary?.evidence_level_badge && (
        <div className="mb-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              EVIDENCE_BADGE_CONFIG[articleSummary.evidence_level_badge] ?? "bg-muted text-muted-foreground border-border"
            }`}
          >
            🔬 {articleSummary.evidence_level_badge}
          </span>
        </div>
      )}

      {/* Abstract / AI Summary */}
      {(() => {
        const hasAiSummary = !!(articleSummary?.resumo_popular || articleSummary?.resumo_tecnico);
        const rawAbstract = article.abstract_pt && article.abstract_pt !== "Abstract não disponível." ? article.abstract_pt : "";
        const fallbackText = resumoPt?.trim() || rawAbstract;
        const isShortAbstract = fallbackText.length < 220;

        return (
          <div className="mb-4 space-y-3">
            {hasAiSummary ? (
              <div>
                {/* Tab switcher */}
                <div className="flex gap-1 mb-2">
                  <button
                    onClick={() => setSummaryTab("popular")}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      summaryTab === "popular"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-foreground/10 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    🧑‍🎓 Para leigos
                  </button>
                  <button
                    onClick={() => setSummaryTab("tecnico")}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      summaryTab === "tecnico"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-foreground/10 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    🔬 Técnico
                  </button>
                </div>

                {summaryTab === "popular" && (
                  <div className="bg-muted/40 px-4 pt-3 pb-3 rounded-xl border border-border/60">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Lightbulb size={10} /> Em linguagem simples
                    </p>
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      {articleSummary.resumo_popular}
                    </p>
                  </div>
                )}

                {summaryTab === "tecnico" && (
                  <div className="bg-muted/40 px-4 pt-3 pb-3 rounded-xl border border-border/60">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <FlaskConical size={10} /> Resumo técnico
                    </p>
                    <p className="text-sm text-foreground/75 leading-relaxed">
                      {articleSummary.resumo_tecnico}
                    </p>
                  </div>
                )}

                {/* Relevance to query */}
                {query && article.evidence_reason && (
                  <div className="bg-primary/[0.06] px-4 py-3 rounded-xl border border-primary/15">
                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wide mb-1.5">
                      Relevância para "{query.length > 40 ? query.slice(0, 40) + "…" : query}"
                    </p>
                    <p className="text-xs text-foreground/70 leading-relaxed">{article.evidence_reason}</p>
                  </div>
                )}
              </div>
            ) : fallbackText ? (
              <div className="space-y-2.5">
                {/* Main abstract block */}
                <div className="bg-muted/40 px-4 pt-3 pb-3 rounded-xl border border-border/60">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide mb-2">
                    {resumoPt ? "Resumo (IA)" : article.isMock ? "Sobre este estudo" : "Abstract"}
                  </p>
                  <p className={`text-sm text-foreground/80 leading-relaxed ${!expandedAbstract && fallbackText.length > 320 ? "line-clamp-4" : ""}`}>
                    {fallbackText}
                  </p>
                  {fallbackText.length > 320 && (
                    <button
                      onClick={() => setExpandedAbstract(v => !v)}
                      className="mt-2 text-[11px] text-primary hover:text-primary/80 transition-colors font-semibold"
                    >
                      {expandedAbstract ? "▲ Recolher" : "▼ Ver completo"}
                    </button>
                  )}
                </div>

                {/* Evidence reason — always show when abstract is short */}
                {article.evidence_reason && (isShortAbstract || true) && (
                  <div className="bg-primary/[0.06] px-4 py-3 rounded-xl border border-primary/15">
                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <FlaskConical size={10} />
                      {query
                        ? `Relevância para "${query.length > 35 ? query.slice(0, 35) + "…" : query}"`
                        : "Por que este estudo importa"}
                    </p>
                    <p className="text-xs text-foreground/70 leading-relaxed">{article.evidence_reason}</p>
                  </div>
                )}

                {/* Extra context when abstract is very sparse */}
                {isShortAbstract && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className="bg-muted px-2 py-1 rounded-md border border-border">
                      {studyInfo.icon} {studyInfo.label}
                    </span>
                    {article.journal && article.journal !== "Periódico não informado" && (
                      <span className="bg-muted px-2 py-1 rounded-md border border-border">{article.journal}</span>
                    )}
                    {article.citations > 0 && (
                      <span className="bg-muted px-2 py-1 rounded-md border border-border">{article.citations.toLocaleString()} citações</span>
                    )}
                    {(article.url || article.doi) && (
                      <a
                        href={article.url || `https://doi.org/${article.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                      >
                        <ExternalLink size={9} /> Ver artigo completo
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/30 border border-border/60 px-4 py-4 rounded-xl">
                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wide mb-2">Resumo não disponível</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mb-2">
                  <span>{studyInfo.icon} {studyInfo.label}</span>
                  {article.journal && article.journal !== "Periódico não informado" && <span>· {article.journal}</span>}
                  {article.year && <span>· {article.year}</span>}
                  {article.citations > 0 && <span>· {article.citations.toLocaleString()} citações</span>}
                </div>
                {article.evidence_reason && (
                  <p className="text-xs text-foreground/60 leading-relaxed mt-1">{article.evidence_reason}</p>
                )}
                {(article.url || article.doi) && (
                  <a
                    href={article.url || `https://doi.org/${article.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <ExternalLink size={10} /> Ver no periódico
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Bias warning */}
      {article.potential_bias && article.potential_bias !== "Nenhum identificado" && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>Conflito ou viés: {article.potential_bias}</span>
        </div>
      )}

      {/* ABNT Reference */}
      <div className="mb-3">
        <button
          onClick={() => setShowAbnt(!showAbnt)}
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground transition-colors mb-1"
        >
          <FileText size={12} />
          Referência ABNT
          {showAbnt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showAbnt && (
          <div className="bg-foreground/[0.03] border border-foreground/5 rounded-xl p-3 text-xs text-foreground/70 font-mono leading-relaxed">
            {article.abnt}
            <button
              onClick={copyAbnt}
              className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              {copiedAbnt ? <Check size={10} /> : <Copy size={10} />}
              {copiedAbnt ? "Copiado!" : "Copiar ABNT"}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Artigo mock → badge de demonstração */}
        {article.isMock && (
          <span
            title="Dados de demonstração — este artigo é simulado para fins de demonstração"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-help"
          >
            <AlertTriangle size={12} /> Demonstração
          </span>
        )}
        {/* Artigos reais: Semantic Scholar como link primário */}
        {!article.isMock && article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <ExternalLink size={12} /> Ver artigo
          </a>
        )}
        {/* DOI como link secundário quando disponível */}
        {!article.isMock && article.doi && (
          <a
            href={`https://doi.org/${article.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground/5 text-foreground/60 border border-foreground/10 hover:border-primary/20 hover:text-foreground transition-colors"
            title={`DOI: ${article.doi}`}
          >
            <ExternalLink size={12} /> DOI
          </a>
        )}
        {/* Fallback Google Scholar: mock ou artigo real sem url e sem doi */}
        {(article.isMock || (!article.url && !article.doi)) && (
          <a
            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground/5 text-foreground/60 border border-foreground/10 hover:border-primary/20 hover:text-foreground transition-colors"
          >
            <Search size={12} /> Buscar no Scholar
          </a>
        )}
        {article.is_oa && article.pdf_url && (
          <a
            href={article.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            <Download size={12} /> PDF disponível
          </a>
        )}
        <button
          onClick={() => { setShowAbnt(true); copyAbnt(); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground/5 text-foreground/70 border border-foreground/10 hover:border-primary/20 transition-colors"
        >
          {copiedAbnt ? <Check size={12} /> : <Copy size={12} />}
          {copiedAbnt ? "Copiado!" : "ABNT"}
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            showChat
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-foreground/5 text-foreground/70 border-foreground/10 hover:border-primary/20"
          }`}
        >
          <MessageCircle size={12} /> Perguntar à IA
        </button>
      </div>

      {/* Chat */}
      {showChat && (
        <div className="mt-4 bg-foreground/[0.02] rounded-2xl p-4 border border-foreground/5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageCircle size={14} className="text-primary" />
            <span className="font-semibold">Perguntar sobre este artigo</span>
            <span className="text-[10px] text-muted-foreground/50 ml-auto">contexto: resumo do artigo</span>
          </div>

          {msgs.length === 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground/60 mb-2">💡 Respostas baseadas exclusivamente no resumo do artigo — não no texto completo</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-foreground/10 bg-card/60 text-foreground/80 hover:bg-foreground/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            </div>
          )}

          {msgs.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`text-xs p-3 rounded-xl leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary/10 text-foreground ml-8"
                      : "bg-foreground/[0.03] text-foreground/80 mr-8 border border-foreground/5"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-1 p-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pergunte algo sobre este artigo..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-foreground/10 bg-background/50 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.97] transition-all"
            >
              Enviar
            </button>
          </form>

          <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
            ⚠️ Respostas baseadas exclusivamente no resumo do artigo. Se a informação não constar no resumo, a IA indicará claramente.
          </p>
        </div>
      )}
    </div>
  );
});

/* ── Verification Guide ── */
const VerificationGuide = () => {
  const [open, setOpen] = useState(() => {
    try {
      if (!localStorage.getItem("vguide_seen")) {
        localStorage.setItem("vguide_seen", "1");
        return true;
      }
    } catch {}
    return false;
  });
  return (
    <div className="bg-card/40 border border-foreground/5 rounded-2xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-4 text-xs hover:bg-foreground/[0.02] transition-colors"
      >
        <Shield size={14} className="text-primary shrink-0" />
        <span className="font-bold text-foreground">Como verificar um artigo antes de citar</span>
        <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold ml-1">
          ⚠️ IA pode errar
        </span>
        <span className="ml-auto text-muted-foreground" aria-label={open ? "Fechar guia" : "Abrir guia de verificação"}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-1">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Resumos, referências e metadados são gerados por IA e podem conter imprecisões. 
            Siga os passos abaixo antes de usar qualquer artigo em um trabalho acadêmico.
          </p>
          {VERIFICATION_STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5">
              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{s.n}</span>
              <div>
                <span className="font-semibold text-foreground text-xs">{s.icon} {s.title}</span>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Tab: Análises ── */
const AnalysisTab = ({ result, query }: { result: MockEntry; query: string }) => (
  <div className="space-y-6">
    <div className="bg-card/40 border border-foreground/5 rounded-2xl p-5">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 size={16} className="text-primary" /> Análise Metodológica
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-foreground/[0.03] rounded-xl p-4 border border-foreground/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total de estudos</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{result.count}</div>
        </div>
        <div className="bg-foreground/[0.03] rounded-xl p-4 border border-foreground/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avaliados por pares</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{result.articles.filter(a => a.expert_reviewed).length}/{result.articles.length}</div>
        </div>
        <div className="bg-foreground/[0.03] rounded-xl p-4 border border-foreground/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acesso aberto</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{result.articles.filter(a => a.is_oa).length}/{result.articles.length}</div>
        </div>
      </div>

      <h4 className="font-semibold text-foreground text-sm mb-3">Distribuição por tipo de estudo</h4>
      <div className="space-y-2">
        {Object.entries(
          result.articles.reduce((acc, a) => {
            acc[a.study_type] = (acc[a.study_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, count]) => {
          const info = STUDY_TYPE_MAP[type] || { icon: "📄", label: type };
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground/70 w-48">{info.icon} {info.label}</span>
              <div className="flex-1 bg-foreground/5 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(count / result.articles.length) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground/50 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Source distribution */}
      <h4 className="font-semibold text-foreground text-sm mb-3 mt-6">Distribuição por fonte</h4>
      <div className="space-y-2">
        {Object.entries(
          result.articles.reduce((acc, a) => {
            acc[a.source] = (acc[a.source] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([source, count]) => {
          const badge = SC_BADGES.find(b => b.name === source);
          return (
            <div key={source} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground/70 w-48" style={{ color: badge?.color }}>{source}</span>
              <div className="flex-1 bg-foreground/5 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ backgroundColor: badge?.color || '#666', width: `${(count / result.articles.length) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground/50 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>

    <div className="bg-card/40 border border-foreground/5 rounded-2xl p-5">
      <h4 className="font-semibold text-foreground text-sm mb-3">Pontos inconclusivos</h4>
      <p className="text-sm text-foreground/70 leading-relaxed mb-4">{result.synthesis.inconclusive_summary}</p>
      {result.synthesis.contradict_explanation && (
        <>
          <h4 className="font-semibold text-foreground text-sm mb-2">Por que alguns estudos contradizem?</h4>
          <p className="text-sm text-foreground/70 leading-relaxed">{result.synthesis.contradict_explanation}</p>
        </>
      )}
    </div>

    {/* Study Recortes */}
    {result.synthesis.study_recortes && result.synthesis.study_recortes.length > 0 && (
      <div className="bg-card/40 border border-foreground/5 rounded-2xl p-5">
        <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          🔍 Como os estudos se relacionam (Recortes)
        </h4>
        <div className="space-y-2">
          {result.synthesis.study_recortes.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5">
              <span className="text-lg shrink-0">{["🔬", "📊", "📋", "🧬", "🌐"][i % 5]}</span>
              <p className="text-xs text-foreground/70 leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

/* ── Tab: Referências ── */
const ReferencesTab = ({ result }: { result: MockEntry }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyOne = (abnt: string, key: string) => {
    navigator.clipboard?.writeText(abnt);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAll = () => {
    const all = result.articles.map(a => a.abnt).join("\n\n");
    navigator.clipboard?.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <FileText size={16} className="text-primary" /> Referências ABNT
        </h3>
        <button
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          {copiedAll ? <Check size={12} /> : <Copy size={12} />}
          {copiedAll ? "Copiado tudo!" : "Copiar todas"}
        </button>
      </div>

      {/* Explanatory card */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Info size={14} className="text-primary shrink-0" /> O que são essas referências?
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          As referências abaixo foram geradas automaticamente no formato <strong>ABNT NBR 6023</strong> com base nos metadados dos artigos encontrados.
          São um ponto de partida — sempre valide cada campo (autores, título, volume, páginas, ano) consultando o artigo original antes de incluir em trabalho acadêmico.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>DOIs nesta versão demonstrativa</strong> são exemplos de estrutura e podem não estar ativos. Para verificar um artigo real, acesse <span className="font-mono text-primary">doi.org/[DOI]</span> diretamente.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-300">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>Referências geradas por IA. Sempre confira com o artigo original antes de incluir no seu trabalho.</span>
      </div>

      {/* Article list */}
      {result.articles.map((art) => {
        const key = art.doi || art.title;
        return (
          <div key={key} className="bg-card/40 border border-foreground/5 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">{art.year}</span>
                  <span className="text-[10px] text-muted-foreground">{art.journal}</span>
                  <span className="text-[10px] text-muted-foreground/60">via {art.source}</span>
                </div>
                <p className="text-xs font-mono text-foreground/80 leading-relaxed break-words">{art.abnt}</p>
                {art.doi && (
                  <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">DOI: {art.doi}</p>
                )}
              </div>
              <button
                onClick={() => copyOne(art.abnt, key)}
                aria-label="Copiar referência ABNT"
                className="shrink-0 p-2 rounded-lg hover:bg-foreground/5 transition-colors"
              >
                {copiedKey === key ? <Check size={14} className="text-primary" /> : <Copy size={14} className="text-muted-foreground" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Tab: Split PDF ── */
const SplitPdfTab = ({ onTriggeDev }: { onTriggeDev: () => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    onTriggeDev();
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-primary/10 p-5 rounded-2xl mb-5">
        <FileSearch size={36} className="text-primary" />
      </div>
      <h3 className="font-bold text-foreground text-lg mb-2">Dissecar artigo em PDF</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        Envie um PDF de artigo científico e a IA extrai automaticamente: objetivo, amostra, resultado principal,
        p-valor, conflito de interesse e limitações — até as que os autores não declararam.
      </p>
      <label
        onClick={handleFileClick}
        className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl p-8 w-full max-w-md transition-colors cursor-pointer bg-primary/5 flex flex-col items-center"
      >
        <Download size={24} className="text-primary mx-auto mb-2" />
        <p className="text-sm text-foreground/70">Arraste um PDF ou clique para selecionar</p>
        <p className="text-[10px] text-muted-foreground mt-1">Máximo 20MB · Apenas PDF</p>
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileClick} />
      </label>
      <p className="text-xs text-muted-foreground mt-4">
        Em desenvolvimento · Teste as buscas akademcias enquanto isso
      </p>
    </div>
  );
};

/* ── Async source loading indicator ── */
const SourceLoadingIndicator = ({ loadedSources }: { loadedSources: string[] }) => {
  const allSources = SOURCE_LIST;
  const pending = allSources.filter(s => !loadedSources.includes(s));
  
  if (pending.length === 0) return null;

  return (
    <div className="bg-card/40 border border-foreground/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
      <Loader2 size={16} className="text-primary animate-spin shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-foreground/70">
          Buscando em fontes adicionais...
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {pending.map(s => {
            const badge = SC_BADGES.find(b => b.name === s);
            return (
              <span
                key={s}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full border animate-pulse"
                style={{
                  backgroundColor: `${badge?.color || '#666'}10`,
                  color: `${badge?.color || '#666'}80`,
                  borderColor: `${badge?.color || '#666'}20`,
                }}
              >
                {s}
              </span>
            );
          })}
        </div>
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
  synthesisLoading = false,
  synthesisFailed = false,
  theme,
  onToggleTheme,
}: ResultsViewProps) => {
  const queryIntention = useQueryIntention(query);
  const [activeTab, setActiveTab] = useState("search");
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    try {
      const stored = localStorage.getItem("emerald_saved_articles");
      return stored ? (JSON.parse(stored) as Article[]) : [];
    } catch {
      return [];
    }
  });
  const [scoreFilter, setScoreFilter] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("Todas");
  const [expertFilter, setExpertFilter] = useState(false);
  const [oaFilter, setOaFilter] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);
  const [pdfUnlocked, setPdfUnlocked] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [sortOrder, setSortOrder] = useState<"relevancia" | "recentes" | "evidencia" | "citacoes">("relevancia");
  const [showFeedback, setShowFeedback] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [loadedSources, setLoadedSources] = useState<string[]>(["PubMed", "OpenAlex", "Semantic Scholar"]);
  const [ptEsFilter, setPtEsFilter] = useState(false);
  const scrollPosRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setDisplayCount(5);
    setLoadedSources(["PubMed", "OpenAlex", "Semantic Scholar"]);
    scrollPosRef.current = {};
  }, [result]);

  useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(null), 2500);
    return () => clearTimeout(t);
  }, [savedToast]);

  const handleTabChange = (tabId: string) => {
    scrollPosRef.current[activeTab] = window.scrollY;
    setActiveTab(tabId);
    setTimeout(() => window.scrollTo({ top: scrollPosRef.current[tabId] ?? 0, behavior: "instant" as ScrollBehavior }), 0);
  };

  // Simulate async source loading
  useEffect(() => {
    const batches = [
      { sources: ["CrossRef", "DOAJ", "SciELO"], delay: 800 },
      { sources: ["arXiv", "Europe PMC"], delay: 1600 },
      { sources: ["BASE", "Lens.org"], delay: 2400 },
      { sources: ["CORE", "Cochrane"], delay: 3200 },
      { sources: ["BVS/LILACS"], delay: 4000 },
    ];
    const timers = batches.map(batch =>
      setTimeout(() => {
        setLoadedSources(prev => [...prev, ...batch.sources]);
      }, batch.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [result]);

  const toggleSave = (article: Article) => {
    setSavedArticles((prev) => {
      const isSaved = prev.some((a) => a.title === article.title);
      const updated = isSaved
        ? prev.filter((a) => a.title !== article.title)
        : [...prev, article];
      try {
        localStorage.setItem("emerald_saved_articles", JSON.stringify(updated));
        setSavedToast(isSaved ? "Artigo removido dos salvos" : "Artigo salvo em Meus Salvos 💾");
      } catch {
        setSavedToast("⚠️ Não foi possível salvar — tente fora do modo privado");
      }
      return updated;
    });
  };

  const PT_ES_SOURCES = ["SciELO", "BVS/LILACS"];
  const filteredArticles = result.articles
    .filter((a) => {
      if (scoreFilter > 0 && a.evidence_score < scoreFilter) return false;
      if (sourceFilter !== "Todas" && a.source !== sourceFilter) return false;
      if (expertFilter && !a.expert_reviewed) return false;
      if (oaFilter && !a.is_oa) return false;
      if (ptEsFilter && !PT_ES_SOURCES.includes(a.source)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "recentes") return parseInt(b.year) - parseInt(a.year);
      if (sortOrder === "evidencia") return b.evidence_score - a.evidence_score;
      if (sortOrder === "citacoes") return b.citations - a.citations;
      return 0; // relevancia = original order
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
          <Link
            to="/fontes"
            className="hidden sm:block border border-foreground/20 px-4 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
          >
            Nossas Fontes
          </Link>
          <div className="border border-foreground/20 text-primary px-4 py-1.5 rounded-lg text-sm font-semibold">
            {searchesLeft} buscas restantes
          </div>
          <button
            onClick={() => setShowPlans(true)}
            className="border border-foreground/20 px-4 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
          >
            Planos
          </button>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
              className="border border-foreground/20 p-2 rounded-lg text-foreground/60 hover:text-primary hover:border-primary/30 transition-colors"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </header>

      <PlansModal open={showPlans} onClose={() => setShowPlans(false)} />
      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} />
      <PromoCodeModal
        open={showPromo}
        onClose={() => setShowPromo(false)}
        onSuccess={() => { setShowPromo(false); setPdfUnlocked(true); }}
        featureName="o Split PDF"
      />
      <DevModal open={showDev} onClose={() => setShowDev(false)} onSearch={onSearch} />

      <main className="max-w-4xl mx-auto px-5 py-6">
        {/* TIPS BAR */}
        <div className="bg-card/60 border border-foreground/5 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-primary font-bold flex items-center gap-1.5 mb-1">
              💡 COMO OBTER MELHORES RESULTADOS
            </span>
            <span className="text-muted-foreground">
              Use termos acadêmicos específicos ou perguntas de pesquisa com causa e efeito.
            </span>
          </div>
          <div>
            <span className="text-rose-400 font-bold flex items-center gap-1.5 mb-1">
              ✗ EVITE
            </span>
            <span className="text-muted-foreground">
              alzheimer<br />benefícios do açafrão
            </span>
          </div>
          <div>
            <span className="text-primary font-bold flex items-center gap-1.5 mb-1">
              ✓ PREFIRA
            </span>
            <span className="text-muted-foreground">
              açafrão reduz depressão em adultos?<br />resistência antimicrobiana Enterobacteriaceae
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
                aria-label="Limpar busca"
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
              onClick={() => handleTabChange(tab.id)}
              aria-label={`Aba ${tab.label}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.id === "saved" && savedArticles.length > 0 ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-foreground/10"
                }`}>
                  {savedArticles.length}
                </span>
              ) : tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-foreground/10"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === "analysis" && <AnalysisTab result={result} query={query} />}
        {activeTab === "references" && <ReferencesTab result={result} />}
        {activeTab === "split" && <SplitPdfTab onTriggeDev={() => setShowDev(true)} />}
        {activeTab === "saved" && (
          <div className="space-y-4">
            {savedArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <Bookmark size={40} className="text-muted-foreground/30" />
                <div>
                  <p className="font-semibold text-foreground/60">Nenhum artigo salvo ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use o ícone <Bookmark size={12} className="inline" /> nos artigos para salvá-los aqui
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {savedArticles.length} artigo{savedArticles.length !== 1 ? "s" : ""} salvo{savedArticles.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">💾 Salvos neste dispositivo — não sincronizados em nuvem</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!confirm(`Remover todos os ${savedArticles.length} artigos salvos? Esta ação não pode ser desfeita.`)) return;
                      setSavedArticles([]);
                      try { localStorage.removeItem("emerald_saved_articles"); } catch {}
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Limpar todos
                  </button>
                </div>
                {savedArticles.map((art) => (
                  <ArticleCard
                    key={art.title}
                    article={art}
                    saved={true}
                    onSave={() => toggleSave(art)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === "search" && (
          <>
            {/* ASYNC SOURCE LOADING */}
            <SourceLoadingIndicator loadedSources={loadedSources} />

            {/* BANNER: MODO DEMONSTRAÇÃO */}
            {result.articles.some((a) => a.isMock) && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm mb-4">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Modo demonstração — busca em tempo real indisponível</p>
                  <p className="text-xs text-amber-400/80">
                    A API de busca não respondeu e o sistema carregou dados de exemplo.
                    Os artigos abaixo são simulados. Use "Buscar no Scholar" para acessar publicações reais.
                  </p>
                </div>
              </div>
            )}

            {/* QUERY INTENTION INDICATOR */}
            <div className={`rounded-2xl p-4 mb-6 border ${
              queryIntention.mode === "consensus"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-blue-500/5 border-blue-500/20"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  queryIntention.mode === "consensus"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}>
                  {queryIntention.mode === "consensus" ? "🎯 Modo: Análise de Consenso" : "📋 Modo: Resumo Interpretativo"}
                </span>
                <span className={`text-xs ${
                  queryIntention.mode === "consensus"
                    ? "text-emerald-300"
                    : "text-blue-300"
                }`}>
                  {queryIntention.description}
                </span>
              </div>
            </div>

            {/* UNIFIED SYNTHESIS PANEL */}
            <SynthesisPanel
              query={query}
              count={result.count}
              synthesis={result.synthesis}
              queryType={queryIntention.mode === "consensus" ? "hypothesis" : "broad"}
              articles={result.articles}
              synthesisLoading={synthesisLoading}
              synthesisFailed={synthesisFailed}
            />

            {/* AI WARNING */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-6">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Resumos e metadados são gerados por IA e podem conter imprecisões. Verifique o artigo original antes de citar.
              </span>
            </div>

            {/* VERIFICATION GUIDE */}
            <VerificationGuide />

            {/* SORT */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-semibold">Ordenar:</span>
              {([
                { id: "relevancia", label: "Relevância" },
                { id: "recentes", label: "Mais recentes" },
                { id: "evidencia", label: "Maior evidência" },
                { id: "citacoes", label: "Mais citados" },
              ] as const).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortOrder(s.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    sortOrder === s.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-foreground/10 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* FILTERS */}
            <div className="flex items-center gap-3 flex-wrap mb-3 text-xs">
              <span className="text-muted-foreground font-semibold">
                {filteredArticles.length} artigos
              </span>
              <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded accent-primary" checked={expertFilter} onChange={(e) => setExpertFilter(e.target.checked)} /> Avaliados por especialistas
              </label>
              <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded accent-primary" checked={oaFilter} onChange={(e) => setOaFilter(e.target.checked)} /> Acesso aberto
              </label>
              <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded accent-primary" checked={ptEsFilter} onChange={(e) => setPtEsFilter(e.target.checked)} /> Priorizar PT/ES
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

            {/* ARTICLES */}
            <div className="space-y-4">
              {filteredArticles.slice(0, displayCount).map((art) => {
                const artIdx = result.articles.indexOf(art);
                // Chave numérica (1-based) — formato novo e confiável
                const numKey = String(artIdx + 1);
                // Fallbacks para formatos antigos (DOI e n/a-X)
                const doiKey = art.doi && art.doi !== "n/a" ? art.doi : `n/a-${artIdx + 1}`;
                const summaries = result.synthesis.article_summaries;
                return (
                <ArticleCard
                  key={art.doi || art.title}
                  article={art}
                  saved={savedArticles.some((s) => s.title === art.title)}
                  onSave={() => toggleSave(art)}
                  resumoPt={
                    result.synthesis.resumos_pt?.[numKey] ||
                    result.synthesis.resumos_pt?.[art.doi] ||
                    result.synthesis.resumos_pt?.[`n/a-${artIdx + 1}`]
                  }
                  articleSummary={
                    summaries?.[numKey] ||
                    summaries?.[doiKey] ||
                    summaries?.[`n/a-${artIdx + 1}`]
                  }
                  query={query}
                />
                );
              })}
            </div>

            {/* LOAD MORE */}
            <div className="mt-8 flex flex-col items-center gap-3">
              {displayCount < filteredArticles.length ? (
                <button
                  onClick={() => {
                    if (loadMoreLoading) return;
                    setLoadMoreLoading(true);
                    setTimeout(() => {
                      setLoadMoreLoading(false);
                      setDisplayCount((prev) => Math.min(prev + 5, filteredArticles.length));
                    }, 1200);
                  }}
                  className="bg-card/60 border border-foreground/10 hover:border-primary/30 px-8 py-3 rounded-2xl text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
                >
                  {loadMoreLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Buscando mais artigos...</>
                    : <><Search size={16} /> Carregar mais {Math.min(5, filteredArticles.length - displayCount)} artigos</>
                  }
                </button>
              ) : (
                <div className="text-center space-y-1">
                  <p className="text-xs text-emerald-500 font-semibold">
                    ✓ Você está vendo todos os {filteredArticles.length} artigos analisados nesta busca.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Para resultados de buscas diferentes, use a barra de pesquisa acima.
                  </p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                {searchesLeft} buscas restantes · <button onClick={() => setShowPlans(true)} className="text-primary hover:underline">Upgrade para mais</button>
              </p>
            </div>
          </>
        )}
      </main>

      {/* Saved toast */}
      {savedToast && (
        <div className="fixed bottom-24 right-6 bg-foreground text-background text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl z-50 pointer-events-none">
          {savedToast}
        </div>
      )}

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

export default ResultsView;

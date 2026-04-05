import { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  BookOpen,
  TrendingUp,
  Gauge,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  FlaskConical,
  Info,
  BrainCircuit,
  ChevronDown,
} from "lucide-react";
import type { Synthesis, Article, CitedSource } from "@/data/mockDatabase";
import { type QueryType } from "@/data/mockDatabase";

interface SynthesisPanelProps {
  query: string;
  count: number;
  synthesis: Synthesis;
  queryType: QueryType;
  articles: Article[];
  /** artigos após filtro/ordenação — usado para numerar Fontes Citadas na ordem visual */
  filteredArticles?: Article[];
  synthesisLoading?: boolean;
  synthesisFailed?: boolean;
  onEnsureArticleVisible?: (articleIndex: number) => void;
}

const VENUE_CONFIG: Record<string, { label: string; cls: string }> = {
  journal: {
    label: "Periódico",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  conference: {
    label: "Conferência",
    cls: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  preprint: {
    label: "Preprint",
    cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  other: {
    label: "Outro",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

/** ICM score → color/label */
const icmConfig = (score: number) => {
  if (score >= 8.5) return { color: "text-emerald-400", bar: "bg-emerald-400", label: "Muito forte" };
  if (score >= 7)   return { color: "text-blue-400",    bar: "bg-blue-400",    label: "Forte" };
  if (score >= 5)   return { color: "text-amber-400",   bar: "bg-amber-400",   label: "Moderado" };
  return              { color: "text-rose-400",   bar: "bg-rose-400",   label: "Limitado" };
};

function CitationBadge({
  num,
  active,
  onClick,
  href,
}: {
  num: number;
  active: boolean;
  onClick: () => void;
  href?: string;
}) {
  const cls = `inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 text-[9px] font-black rounded transition-all mx-0.5 align-middle border ${
    active
      ? "bg-primary text-primary-foreground border-primary scale-110 shadow-md shadow-primary/30"
      : "bg-primary/15 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary"
  }`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={cls}
      >
        {num}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {num}
    </button>
  );
}

function renderWithCitations(
  text: string,
  activeCite: number | null,
  onCiteClick: (n: number) => void,
  citedSources: CitedSource[]
): React.ReactNode[] {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const num = +match[1];
      const src = citedSources.find((s) => s.index === num);
      const href =
        src?.doi && src.doi !== "n/a"
          ? `https://doi.org/${src.doi}`
          : undefined;
      return (
        <CitationBadge
          key={i}
          num={num}
          active={activeCite === num}
          onClick={() => onCiteClick(num)}
          href={href}
        />
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function buildFallbackSources(articles: Article[]): CitedSource[] {
  return articles.slice(0, 8).map((a, i) => ({
    index: i + 1,
    title: a.title,
    doi: a.doi,
    citations: a.citations,
    year: a.year,
    authors: a.authors.split(",")[0].trim() + (a.authors.includes(",") ? " et al." : ""),
    venue_type:
      a.source === "arXiv"
        ? "preprint"
        : ("journal" as "journal" | "conference" | "preprint" | "other"),
    evidence_level: a.evidence_reason || `${a.study_type} · ${a.source}`,
  }));
}

const SynthesisPanel = ({
  query,
  count,
  synthesis,
  queryType,
  articles,
  filteredArticles,
  synthesisLoading = false,
  synthesisFailed = false,
  onEnsureArticleVisible,
}: SynthesisPanelProps) => {
  // Lista de artigos para numeração visual (Fontes Citadas + "Estudos encontrados")
  const displayArticles = filteredArticles ?? articles;
  const [activeTab, setActiveTab] = useState<"distribuicao" | "detalhes" | "insights">("distribuicao");
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const [showIcmInfo, setShowIcmInfo] = useState(false);
  const [showSynthesisInfo, setShowSynthesisInfo] = useState(false);
  const [mobileCitesOpen, setMobileCitesOpen] = useState(false);
  const sidebarRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const icmRaw = synthesis.confidence_score / 10;
  const icmScore = icmRaw.toFixed(1);
  const icm = icmConfig(icmRaw);

  const hasConsensusData =
    synthesis.consensus_agree > 0 || synthesis.consensus_contradict > 0;
  const showConsensus = queryType === "hypothesis" && hasConsensusData;

  const citedSources =
    synthesis.cited_sources?.length
      ? synthesis.cited_sources
      : buildFallbackSources(displayArticles);

  const synthesisText = synthesis.inline_synthesis || synthesis.direct_answer;
  const hasInlineCitations = !!(
    synthesis.inline_synthesis && synthesis.inline_synthesis.includes("[")
  );

  const handleCiteClick = (num: number) => {
    const next = activeCite === num ? null : num;
    setActiveCite(next);
    if (next !== null) {
      const doScroll = () => {
        const articleEl = document.getElementById(`article-${num}`);
        if (articleEl) {
          articleEl.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          sidebarRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      };
      // If article might not be in DOM yet, ensure it's loaded first
      const articleEl = document.getElementById(`article-${num}`);
      if (!articleEl && onEnsureArticleVisible) {
        onEnsureArticleVisible(num);
        setTimeout(doScroll, 120);
      } else {
        doScroll();
      }
    }
  };

  const tabs = [
    ...(showConsensus ? [{ id: "distribuicao" as const, label: "Distribuição" }] : []),
    { id: "detalhes" as const, label: "Análise" },
    { id: "insights" as const, label: "Insights" },
  ];

  useEffect(() => {
    if (!showConsensus && activeTab === "distribuicao") setActiveTab("detalhes");
  }, [showConsensus, activeTab]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-xl mb-6 bg-card">

      {/* ── Header ── */}
      <div className="bg-muted/50 px-5 py-4 border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <BrainCircuit size={14} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                {count} estudos · Motor de Evidências
              </span>
              {synthesisLoading && (
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 animate-pulse">
                  Gerando síntese com IA...
                </span>
              )}
              {synthesis.maturity_label && !synthesisLoading && (
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    synthesis.maturity_label.includes("Consenso")
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30"
                      : synthesis.maturity_label.includes("Debate")
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30"
                        : "bg-primary/15 text-primary border-primary/30"
                  }`}
                >
                  {synthesis.maturity_label}
                </span>
              )}
            </div>
            <h3 className="text-foreground font-semibold text-base leading-snug">
              "{query}"
            </h3>
          </div>

          {/* ICM widget */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center">
              <button
                onClick={() => setShowIcmInfo(v => !v)}
                className="flex items-center gap-1 group"
                title="O que é o ICM?"
              >
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-3xl font-black tabular-nums ${icm.color}`}>
                    {icmScore}
                  </span>
                  <span className="text-xs text-muted-foreground/60">/10</span>
                </div>
                <Info size={11} className="text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
              </button>
              <p className={`text-[10px] font-semibold mt-0.5 ${icm.color}`}>
                ICM · {icm.label}
              </p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div
              className="text-center cursor-help"
              title={
                synthesis.confidence_level === "muito alto" || synthesis.confidence_level === "muito alta"
                  ? "Muito Alta: base sólida de meta-análises e revisões Cochrane com resultados consistentes"
                  : synthesis.confidence_level === "alto" || synthesis.confidence_level === "alta"
                  ? "Alta: múltiplos ECRs e revisões sistemáticas convergindo para conclusões similares"
                  : synthesis.confidence_level === "moderado" || synthesis.confidence_level === "moderada"
                  ? "Moderada: estudos de qualidade (coortes, observacionais) mas sem meta-análises abrangentes — resultados confiáveis porém não definitivos"
                  : synthesis.confidence_level === "baixo" || synthesis.confidence_level === "baixa"
                  ? "Baixa: poucos estudos, amostras pequenas ou resultados divergentes — use com cautela"
                  : "Nível de confiança geral do conjunto de evidências"
              }
            >
              <Gauge size={18} className="text-primary mx-auto mb-0.5" />
              <p className="text-xs font-bold text-foreground capitalize">
                {synthesis.confidence_level}
              </p>
              <p className="text-[10px] text-muted-foreground">Confiança ⓘ</p>
            </div>
          </div>
        </div>

        {/* ICM explanation (expandable) */}
        {showIcmInfo && (
          <div className="mt-3 p-3 rounded-xl bg-primary/[0.07] border border-primary/20 text-xs text-foreground/75 leading-relaxed">
            <p className="font-bold text-foreground/90 mb-1">O que é o ICM (Índice de Confiança Metodológica)?</p>
            <p>
              O ICM vai de <strong>0 a 10</strong> e estima a qualidade metodológica do conjunto de estudos encontrados.
              Ele combina: tipo de estudo (meta-análise = peso máximo), revisão por pares, recência, número de citações e diversidade de fontes.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
              <span className="text-emerald-400 font-semibold">8,5–10 · Muito forte</span><span className="text-muted-foreground">Meta-análises e revisões Cochrane robustas</span>
              <span className="text-blue-400 font-semibold">7,0–8,4 · Forte</span><span className="text-muted-foreground">Múltiplos ECRs e revisões sistemáticas</span>
              <span className="text-amber-400 font-semibold">5,0–6,9 · Moderado</span><span className="text-muted-foreground">Coortes, estudos observacionais de qualidade</span>
              <span className="text-rose-400 font-semibold">0–4,9 · Limitado</span><span className="text-muted-foreground">Poucos estudos, preprints ou amostras pequenas</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Consenso da Ciência ── */}
      <div className="px-5 pt-4 pb-2">
        {/* Source badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[...new Set(articles.map((a) => a.source))]
            .slice(0, 8)
            .map((src) => (
              <span
                key={src}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border"
              >
                {src}
              </span>
            ))}
        </div>

        {/* Synthesis block */}
        {synthesisLoading ? (
          <div className="border-l-4 border-primary/40 bg-primary/[0.05] rounded-r-xl pl-4 pr-4 py-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit size={13} className="text-primary/50 shrink-0 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50">
                Gerando síntese da evidência...
              </span>
            </div>
            <div className="space-y-2.5 animate-pulse">
              <div className="h-3 bg-muted rounded-full w-full" />
              <div className="h-3 bg-muted rounded-full w-[94%]" />
              <div className="h-3 bg-muted rounded-full w-[82%]" />
              <div className="h-3 bg-muted rounded-full w-[88%]" />
              <div className="h-3 bg-muted rounded-full w-[65%]" />
            </div>
          </div>
        ) : synthesisFailed ? (
          <div className="border border-dashed border-border bg-muted/20 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
            <BrainCircuit size={15} className="text-muted-foreground/50 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">Síntese IA indisponível</p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                A síntese por IA não foi gerada para esta busca. Consulte os artigos abaixo — cada um possui seu resumo e nível de evidência.
              </p>
            </div>
          </div>
        ) : synthesisText ? (
          <div className="border-l-4 border-primary bg-primary/[0.06] rounded-r-xl pl-4 pr-4 py-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={13} className="text-primary shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                Síntese da Evidência
              </span>
              <button
                onClick={() => setShowSynthesisInfo(v => !v)}
                className="text-[9px] text-muted-foreground/50 hover:text-primary/60 transition-colors flex items-center gap-0.5"
              >
                <Info size={9} /> O que é isso?
              </button>
            </div>
            {showSynthesisInfo && (
              <div className="mb-3 p-3 rounded-xl bg-primary/[0.06] border border-primary/15 text-xs text-foreground/70 leading-relaxed space-y-1.5">
                <p className="font-semibold text-foreground/90">O que é a Síntese da Evidência?</p>
                <p>
                  É um resumo interpretativo gerado por IA que cruza os estudos encontrados para destacar os pontos de
                  convergência, contradição e lacunas. Diferente de uma revisão sistemática humana, ela é produzida
                  automaticamente — é um ponto de partida para leitura, não uma conclusão definitiva.
                </p>
                <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/40">
                  ⚠️ Sempre consulte os artigos originais antes de citar qualquer afirmação desta síntese.
                </p>
              </div>
            )}
            <p className="text-sm text-foreground leading-relaxed">
              {renderWithCitations(synthesisText, activeCite, handleCiteClick, citedSources)}
            </p>
            {hasInlineCitations && (
              <p className="text-[10px] text-muted-foreground/50 mt-2.5 pt-2 border-t border-border/60">
                Toque em [N] para ir ao artigo correspondente abaixo
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Body: two-column layout ── */}
      <div className="flex flex-col lg:flex-row min-h-0 border-t border-border/60">

        {/* Left: tabs */}
        <div className="flex-1 px-5 py-4 min-w-0">
          {/* Inner tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Distribuição */}
          {activeTab === "distribuicao" && showConsensus && (
            <div className="space-y-3">
              {[
                {
                  label: "Concordam",
                  value: synthesis.consensus_agree,
                  fillCls: "bg-emerald-500",
                  textCls: "text-emerald-600 dark:text-emerald-400",
                  icon: <CheckCircle2 size={11} />,
                },
                {
                  label: "Inconclusivo",
                  value: synthesis.consensus_inconclusive,
                  fillCls: "bg-amber-500",
                  textCls: "text-amber-600 dark:text-amber-400",
                  icon: <AlertTriangle size={11} />,
                },
                {
                  label: "Contradizem",
                  value: synthesis.consensus_contradict,
                  fillCls: "bg-rose-500",
                  textCls: "text-rose-600 dark:text-rose-400",
                  icon: <XCircle size={11} />,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-semibold w-24 flex items-center gap-1.5 shrink-0 ${row.textCls}`}
                  >
                    {row.icon} {row.label}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.fillCls} transition-all duration-700`}
                      style={{ width: `${row.value}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${row.textCls} w-10 text-right`}>
                    {row.value}%
                  </span>
                </div>
              ))}
              {/* ICM reprise */}
              <div className="mt-3 pt-3 border-t border-border flex items-baseline gap-2">
                <span className={`text-xl font-black ${icm.color}`}>{icmScore}</span>
                <span className="text-xs text-muted-foreground">/10 · ICM — {icm.label}</span>
              </div>
            </div>
          )}

          {/* Tab: Análise */}
          {(activeTab === "detalhes" ||
            (!showConsensus && activeTab === "distribuicao")) && (
            <div className="space-y-4">
              {(() => {
                const isAutoGenerated = (r: string) =>
                  /achado com \d+ cit\.|p-valor não disponível|p-valor=n\/a|p-valor não inform|achado com n=\d|Estudo \[.*\]:\s*achado/.test(r);
                const recortes = synthesis.study_recortes ?? [];
                const useAutoFallback =
                  recortes.length === 0 || recortes.every(isAutoGenerated);

                if (useAutoFallback && displayArticles.length > 0) {
                  // Show article-derived summary instead of ugly auto-generated text
                  return (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <FlaskConical size={12} className="text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Estudos encontrados
                        </span>
                      </div>
                      <div className="space-y-2">
                        {displayArticles.slice(0, 6).map((art, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const el = document.getElementById(`article-${i + 1}`);
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            className="w-full flex gap-2 p-3 bg-muted/40 rounded-lg border border-border/60 hover:border-primary/30 transition-colors text-left"
                          >
                            <span className="text-muted-foreground/50 text-xs shrink-0 mt-0.5 font-bold w-4">
                              {i + 1}.
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-foreground/80 leading-snug font-medium line-clamp-2">
                                {art.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {art.authors.split(",")[0].trim()}{art.authors.includes(",") ? " et al." : ""} · {art.year}
                                {art.citations > 0 ? ` · ${art.citations.toLocaleString("pt-BR")} cit.` : ""}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FlaskConical size={12} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        O que os estudos encontraram
                      </span>
                    </div>
                    <div className="space-y-2">
                      {recortes.map((r, i) => (
                        <div
                          key={i}
                          className="flex gap-2 p-3 bg-muted/40 rounded-lg border border-border/60"
                        >
                          <span className="text-muted-foreground/50 text-xs shrink-0 mt-0.5 font-bold">
                            {i + 1}.
                          </span>
                          <p className="text-xs text-foreground/80 leading-relaxed">{r}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {synthesis.inconclusive_summary && (synthesis.consensus_inconclusive + synthesis.consensus_contradict) > 25 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                    Pontos em debate
                  </span>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {synthesis.inconclusive_summary}
                  </p>
                </div>
              )}
              {synthesis.confidence_reasons && synthesis.confidence_reasons.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    Qualidade da evidência
                    <span className="text-muted-foreground/50 font-normal normal-case tracking-normal ml-1">
                      — por que a confiança é este nível?
                    </span>
                  </span>
                  {synthesis.confidence_reasons.map((r, i) => (
                    <p key={i} className="text-xs text-foreground/65 mt-1">
                      · {r}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Insights */}
          {activeTab === "insights" && (
            <div className="space-y-4">
              {synthesis.practical_insight && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={13} className="text-amber-500 dark:text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Aplicação prática
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {synthesis.practical_insight}
                  </p>
                </div>
              )}
              {synthesis.search_tip && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap size={13} className="text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Dica de busca
                    </span>
                  </div>
                  <p className="text-xs text-foreground/65 leading-relaxed">
                    {synthesis.search_tip}
                  </p>
                </div>
              )}

              {/* Derived stats — always shown */}
              {articles.length > 0 && (() => {
                const topCited = [...articles].sort((a, b) => b.citations - a.citations)[0];
                const mostRecent = [...articles].sort((a, b) => parseInt(b.year) - parseInt(a.year))[0];
                const oa = articles.filter(a => a.is_oa).length;
                const highEvidence = articles.filter(a => a.evidence_score >= 4).length;
                return (
                  <div className="pt-2 border-t border-border/60 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                      Perfil dos estudos encontrados
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/40 rounded-lg p-2.5 border border-border/60">
                        <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold mb-0.5">Alta evidência</p>
                        <p className="text-lg font-black text-foreground">{highEvidence}<span className="text-xs font-normal text-muted-foreground">/{articles.length}</span></p>
                        <p className="text-[9px] text-muted-foreground">revisões/meta-análises</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2.5 border border-border/60">
                        <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold mb-0.5">Acesso aberto</p>
                        <p className="text-lg font-black text-foreground">{oa}<span className="text-xs font-normal text-muted-foreground">/{articles.length}</span></p>
                        <p className="text-[9px] text-muted-foreground">disponíveis livremente</p>
                      </div>
                    </div>
                    {topCited && (
                      <button
                        onClick={() => {
                          const idx = displayArticles.indexOf(topCited);
                          if (idx >= 0) {
                            const el = document.getElementById(`article-${idx + 1}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }}
                        className="w-full text-left p-2.5 bg-muted/40 rounded-lg border border-border/60 hover:border-primary/30 transition-colors"
                      >
                        <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold mb-0.5">Mais citado</p>
                        <p className="text-xs text-foreground/80 font-medium line-clamp-1">{topCited.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{topCited.citations.toLocaleString("pt-BR")} citações · {topCited.year}</p>
                      </button>
                    )}
                    {mostRecent && mostRecent !== topCited && (
                      <button
                        onClick={() => {
                          const idx = displayArticles.indexOf(mostRecent);
                          if (idx >= 0) {
                            const el = document.getElementById(`article-${idx + 1}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }}
                        className="w-full text-left p-2.5 bg-muted/40 rounded-lg border border-border/60 hover:border-primary/30 transition-colors"
                      >
                        <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-bold mb-0.5">Mais recente</p>
                        <p className="text-xs text-foreground/80 font-medium line-clamp-1">{mostRecent.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{mostRecent.year} · {mostRecent.journal}</p>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Right: Cited Sources sidebar ── */}
        <div className={`lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-border/60 bg-muted/20 ${synthesisFailed ? "hidden" : ""}`}>
          {/* Header — clicável no mobile para expandir/colapsar */}
          <button
            onClick={() => setMobileCitesOpen(v => !v)}
            className="flex items-center justify-between w-full px-4 py-3 lg:py-4 lg:cursor-default"
            aria-expanded={mobileCitesOpen}
          >
            <div className="flex items-center gap-2">
              <BookOpen size={13} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fontes Citadas ({citedSources.length})
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-muted-foreground/50 transition-transform lg:hidden ${mobileCitesOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div className={`px-4 pb-4 space-y-2.5 max-h-[460px] overflow-y-auto pr-0.5 ${mobileCitesOpen ? "block" : "hidden"} lg:block`}>
            {citedSources.map((src) => {
              const vConf = VENUE_CONFIG[src.venue_type] ?? VENUE_CONFIG.other;
              const isActive = activeCite === src.index;
              return (
                <div
                  key={src.index}
                  ref={(el) => {
                    sidebarRefs.current[src.index] = el;
                  }}
                  onClick={() => handleCiteClick(src.index)}
                  className={`rounded-xl p-3 border cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-primary/15 border-primary/40 shadow-sm"
                      : "bg-card border-border hover:border-border/80 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5 transition-colors ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {src.index}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-1.5">
                        {src.title}
                      </p>

                      {src.authors && (
                        <p className="text-[10px] text-muted-foreground mb-1 truncate">
                          {src.authors}
                          {src.year ? ` · ${src.year}` : ""}
                        </p>
                      )}

                      {src.doi && src.doi !== "n/a" && (
                        <a
                          href={`https://doi.org/${src.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 mb-1.5 transition-colors"
                        >
                          <ExternalLink size={9} />
                          <span className="truncate max-w-[160px]">doi:{src.doi}</span>
                        </a>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${vConf.cls}`}>
                          {vConf.label}
                        </span>
                        {src.citations > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <TrendingUp size={9} />
                            {src.citations.toLocaleString("pt-BR")} cit.
                          </span>
                        )}
                      </div>

                      {src.evidence_level && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 leading-tight">
                          {src.evidence_level}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynthesisPanel;

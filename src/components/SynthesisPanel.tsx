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
} from "lucide-react";
import type { Synthesis, Article, CitedSource } from "@/data/mockDatabase";
import { type QueryType } from "@/data/mockDatabase";

interface SynthesisPanelProps {
  query: string;
  count: number;
  synthesis: Synthesis;
  queryType: QueryType;
  articles: Article[];
  synthesisLoading?: boolean;
}

const VENUE_CONFIG: Record<
  string,
  { label: string; cls: string }
> = {
  journal: {
    label: "Periódico",
    cls: "bg-emerald-900/50 text-emerald-300 border-emerald-700/60",
  },
  conference: {
    label: "Conferência",
    cls: "bg-sky-900/50 text-sky-300 border-sky-700/60",
  },
  preprint: {
    label: "Preprint",
    cls: "bg-amber-900/50 text-amber-300 border-amber-700/60",
  },
  other: {
    label: "Outro",
    cls: "bg-slate-800 text-slate-400 border-slate-700",
  },
};

function CitationBadge({
  num,
  active,
  onClick,
}: {
  num: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 text-[9px] font-black rounded transition-all mx-0.5 align-middle border ${
        active
          ? "bg-blue-500 text-white border-blue-400 scale-110 shadow-md shadow-blue-500/30"
          : "bg-blue-900/60 text-blue-300 border-blue-700/60 hover:bg-blue-500 hover:text-white hover:border-blue-400"
      }`}
    >
      {num}
    </button>
  );
}

function renderWithCitations(
  text: string,
  activeCite: number | null,
  onCiteClick: (n: number) => void
): React.ReactNode[] {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const num = +match[1];
      return (
        <CitationBadge
          key={i}
          num={num}
          active={activeCite === num}
          onClick={() => onCiteClick(num)}
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
  synthesisLoading = false,
}: SynthesisPanelProps) => {
  const [activeTab, setActiveTab] = useState<
    "distribuicao" | "detalhes" | "insights"
  >("distribuicao");
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const sidebarRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const icmScore = (synthesis.confidence_score / 10).toFixed(1);
  const icmLabel =
    +icmScore >= 8
      ? "Muito forte"
      : +icmScore >= 6
        ? "Forte"
        : +icmScore >= 4
          ? "Moderado"
          : "Limitado";
  const hasConsensusData =
    synthesis.consensus_agree > 0 || synthesis.consensus_contradict > 0;
  const showConsensus = queryType === "hypothesis" && hasConsensusData;

  const citedSources =
    synthesis.cited_sources?.length
      ? synthesis.cited_sources
      : buildFallbackSources(articles);

  const synthesisText = synthesis.inline_synthesis || synthesis.direct_answer;
  const hasInlineCitations = !!(
    synthesis.inline_synthesis && synthesis.inline_synthesis.includes("[")
  );

  const handleCiteClick = (num: number) => {
    const next = activeCite === num ? null : num;
    setActiveCite(next);
    if (next !== null) {
      setTimeout(() => {
        sidebarRefs.current[next]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 50);
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
    <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl mb-6 bg-[#0c1628]">
      {/* ── Header ── */}
      <div className="bg-[#0f2547] px-6 py-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/80">
              {count} ESTUDOS · MOTOR DE EVIDÊNCIAS
            </span>
            {synthesisLoading && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse">
                Gerando síntese com IA...
              </span>
            )}
            {synthesis.maturity_label && !synthesisLoading && (
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  synthesis.maturity_label.includes("Consenso")
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-600/40"
                    : synthesis.maturity_label.includes("Debate")
                      ? "bg-amber-500/15 text-amber-300 border-amber-600/40"
                      : "bg-sky-500/15 text-sky-300 border-sky-600/40"
                }`}
              >
                {synthesis.maturity_label}
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-lg leading-snug truncate">
            "{query}"
          </h3>
        </div>

        {/* ICM + Confidence */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="flex items-baseline gap-0.5 justify-center">
              <span className="text-3xl font-black text-white tabular-nums">
                {icmScore}
              </span>
              <span className="text-xs text-blue-300/70">/10</span>
            </div>
            <p className="text-[10px] text-blue-300/60 font-medium">
              ICM · {icmLabel}
            </p>
          </div>
          <div className="w-px h-10 bg-blue-800/60" />
          <div className="text-center">
            <Gauge size={18} className="text-blue-300 mx-auto mb-0.5" />
            <p className="text-xs font-bold text-white capitalize">
              {synthesis.confidence_level}
            </p>
            <p className="text-[10px] text-blue-300/60">Confiança</p>
          </div>
        </div>
      </div>

      {/* ── Body: two-column layout ── */}
      <div className="flex flex-col lg:flex-row min-h-0">
        {/* Left: synthesis text + tabs */}
        <div className="flex-1 px-6 py-5 min-w-0">
          {/* Source badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[...new Set(articles.map((a) => a.source))]
              .slice(0, 7)
              .map((src) => (
                <span
                  key={src}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/70"
                >
                  {src}
                </span>
              ))}
          </div>

          {/* Synthesis text */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-5 border border-slate-700/40">
            {synthesisLoading ? (
              <div className="space-y-2.5 animate-pulse">
                <div className="h-3 bg-slate-700/80 rounded-full w-full" />
                <div className="h-3 bg-slate-700/80 rounded-full w-[92%]" />
                <div className="h-3 bg-slate-700/80 rounded-full w-[78%]" />
                <div className="h-3 bg-slate-700/80 rounded-full w-[85%]" />
                <div className="h-3 bg-slate-700/80 rounded-full w-[60%]" />
              </div>
            ) : (
              <p className="text-sm text-slate-200 leading-relaxed">
                {renderWithCitations(synthesisText, activeCite, handleCiteClick)}
              </p>
            )}
            {hasInlineCitations && !synthesisLoading && (
              <p className="text-[10px] text-slate-600 mt-2.5 pt-2 border-t border-slate-700/40">
                Toque em [N] para destacar a fonte citada no painel lateral
              </p>
            )}
          </div>

          {/* Inner tabs */}
          <div className="flex gap-1 bg-slate-800/40 rounded-lg p-1 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-slate-700 text-white"
                    : "text-slate-500 hover:text-slate-300"
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
                  fillCls: "bg-emerald-400",
                  textCls: "text-emerald-400",
                  icon: <CheckCircle2 size={11} />,
                },
                {
                  label: "Inconclusivo",
                  value: synthesis.consensus_inconclusive,
                  fillCls: "bg-amber-400",
                  textCls: "text-amber-400",
                  icon: <AlertTriangle size={11} />,
                },
                {
                  label: "Contradizem",
                  value: synthesis.consensus_contradict,
                  fillCls: "bg-rose-400",
                  textCls: "text-rose-400",
                  icon: <XCircle size={11} />,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-semibold w-24 flex items-center gap-1.5 shrink-0 ${row.textCls}`}
                  >
                    {row.icon} {row.label}
                  </span>
                  <div className="flex-1 bg-slate-700/40 rounded-full h-2.5 overflow-hidden">
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
              <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-baseline gap-2">
                <span className="text-xl font-black text-white">{icmScore}</span>
                <span className="text-xs text-slate-500">/10 · ICM — {icmLabel}</span>
              </div>
            </div>
          )}

          {/* Tab: Análise */}
          {(activeTab === "detalhes" ||
            (!showConsensus && activeTab === "distribuicao")) && (
            <div className="space-y-4">
              {synthesis.study_recortes && synthesis.study_recortes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FlaskConical size={12} className="text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      O que os estudos encontraram
                    </span>
                  </div>
                  <div className="space-y-2">
                    {synthesis.study_recortes.map((r, i) => (
                      <div
                        key={i}
                        className="flex gap-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/40"
                      >
                        <span className="text-slate-600 text-xs shrink-0 mt-0.5 font-bold">
                          {i + 1}.
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {synthesis.inconclusive_summary && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">
                    Pontos em debate
                  </span>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {synthesis.inconclusive_summary}
                  </p>
                </div>
              )}
              {synthesis.confidence_reasons && synthesis.confidence_reasons.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Qualidade da evidência
                  </span>
                  {synthesis.confidence_reasons.map((r, i) => (
                    <p key={i} className="text-xs text-slate-400 mt-1">
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
                    <Lightbulb size={13} className="text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Aplicação prática
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {synthesis.practical_insight}
                  </p>
                </div>
              )}
              {synthesis.search_tip && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap size={13} className="text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Dica de busca
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {synthesis.search_tip}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Cited Sources sidebar ── */}
        <div className="lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-700/40 bg-slate-900/30 px-4 py-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={13} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fontes Citadas
            </span>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-0.5">
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
                      ? "bg-blue-900/40 border-blue-500/50 shadow-md shadow-blue-900/30"
                      : "bg-slate-800/30 border-slate-700/40 hover:border-slate-600/60"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Citation index badge */}
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5 transition-colors ${
                        isActive
                          ? "bg-blue-500 text-white"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {src.index}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 leading-tight line-clamp-2 mb-1.5">
                        {src.title}
                      </p>

                      {/* Authors + year */}
                      {src.authors && (
                        <p className="text-[10px] text-slate-500 mb-1 truncate">
                          {src.authors}
                          {src.year ? ` · ${src.year}` : ""}
                        </p>
                      )}

                      {/* DOI link */}
                      {src.doi && src.doi !== "n/a" && (
                        <a
                          href={`https://doi.org/${src.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mb-1.5 transition-colors"
                        >
                          <ExternalLink size={9} />
                          <span className="truncate max-w-[160px]">
                            doi:{src.doi}
                          </span>
                        </a>
                      )}

                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${vConf.cls}`}
                        >
                          {vConf.label}
                        </span>
                        {src.citations > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                            <TrendingUp size={9} />
                            {src.citations.toLocaleString("pt-BR")} cit.
                          </span>
                        )}
                      </div>

                      {/* Evidence level */}
                      {src.evidence_level && (
                        <p className="text-[10px] text-slate-600 mt-1.5 leading-tight">
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

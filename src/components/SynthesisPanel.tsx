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

const VENUE_CONFIG: Record<string, { label: string; cls: string }> = {
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

/** Mapeamento de ICM para cor/label */
const icmConfig = (score: number) => {
  if (score >= 8.5) return { color: "text-emerald-400", bar: "bg-emerald-400", label: "Muito forte" };
  if (score >= 7)   return { color: "text-blue-400",    bar: "bg-blue-400",    label: "Forte" };
  if (score >= 5)   return { color: "text-amber-400",   bar: "bg-amber-400",   label: "Moderado" };
  return              { color: "text-rose-400",    bar: "bg-rose-400",    label: "Limitado" };
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
  const [activeTab, setActiveTab] = useState<"distribuicao" | "detalhes" | "insights">("distribuicao");
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const [showIcmInfo, setShowIcmInfo] = useState(false);
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
    <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl mb-6 bg-[#0c1628]">

      {/* ── Header ── */}
      <div className="bg-[#0f2547] px-5 py-4 border-b border-slate-700/40">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <BrainCircuit size={14} className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/80">
                {count} estudos · Motor de Evidências
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
            <h3 className="text-white font-semibold text-base leading-snug">
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
                  <span className="text-xs text-blue-300/60">/10</span>
                </div>
                <Info size={11} className="text-slate-500 group-hover:text-blue-400 transition-colors mt-1" />
              </button>
              <p className={`text-[10px] font-semibold mt-0.5 ${icm.color}`}>
                ICM · {icm.label}
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

        {/* ICM explanation (expandable) */}
        {showIcmInfo && (
          <div className="mt-3 p-3 rounded-xl bg-blue-950/60 border border-blue-700/30 text-xs text-blue-200/80 leading-relaxed">
            <p className="font-bold text-blue-300 mb-1">O que é o ICM (Índice de Confiança Metodológica)?</p>
            <p>
              O ICM vai de <strong>0 a 10</strong> e estima a qualidade metodológica do conjunto de estudos encontrados.
              Ele combina: tipo de estudo (meta-análise = peso máximo), revisão por pares, recência, número de citações e diversidade de fontes.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
              <span className="text-emerald-400 font-semibold">8,5–10 · Muito forte</span><span>Meta-análises e revisões Cochrane robustas</span>
              <span className="text-blue-400 font-semibold">7,0–8,4 · Forte</span><span>Múltiplos ECRs e revisões sistemáticas</span>
              <span className="text-amber-400 font-semibold">5,0–6,9 · Moderado</span><span>Coortes, estudos observacionais de qualidade</span>
              <span className="text-rose-400 font-semibold">0–4,9 · Limitado</span><span>Poucos estudos, preprints ou amostras pequenas</span>
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
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/70"
              >
                {src}
              </span>
            ))}
        </div>

        {/* Consensus block — highlighted */}
        <div className="border-l-4 border-blue-500 bg-blue-950/30 rounded-r-xl pl-4 pr-4 py-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={13} className="text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              Consenso da Ciência
            </span>
          </div>
          {synthesisLoading ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-3 bg-slate-700/80 rounded-full w-full" />
              <div className="h-3 bg-slate-700/80 rounded-full w-[94%]" />
              <div className="h-3 bg-slate-700/80 rounded-full w-[82%]" />
              <div className="h-3 bg-slate-700/80 rounded-full w-[88%]" />
              <div className="h-3 bg-slate-700/80 rounded-full w-[65%]" />
            </div>
          ) : (
            <p className="text-sm text-slate-100 leading-relaxed">
              {renderWithCitations(synthesisText, activeCite, handleCiteClick)}
            </p>
          )}
          {hasInlineCitations && !synthesisLoading && (
            <p className="text-[10px] text-slate-600 mt-2.5 pt-2 border-t border-slate-700/40">
              Toque em [N] para destacar a fonte citada no painel lateral
            </p>
          )}
        </div>
      </div>

      {/* ── Body: two-column layout ── */}
      <div className="flex flex-col lg:flex-row min-h-0 border-t border-slate-700/30">

        {/* Left: tabs */}
        <div className="flex-1 px-5 py-4 min-w-0">
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
              {/* ICM reprise */}
              <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-baseline gap-2">
                <span className={`text-xl font-black ${icm.color}`}>{icmScore}</span>
                <span className="text-xs text-slate-500">/10 · ICM — {icm.label}</span>
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
        <div className="lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-700/40 bg-slate-900/30 px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={13} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fontes Citadas
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-0.5">
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
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5 transition-colors ${
                        isActive ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {src.index}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 leading-tight line-clamp-2 mb-1.5">
                        {src.title}
                      </p>

                      {src.authors && (
                        <p className="text-[10px] text-slate-500 mb-1 truncate">
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
                          className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mb-1.5 transition-colors"
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
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                            <TrendingUp size={9} />
                            {src.citations.toLocaleString("pt-BR")} cit.
                          </span>
                        )}
                      </div>

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

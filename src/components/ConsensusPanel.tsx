import { Gauge, Lightbulb, ArrowRight, Layers, GitCompare } from "lucide-react";
import type { Synthesis } from "@/data/mockDatabase";
import { type QueryType } from "@/data/mockDatabase";

interface ConsensusPanelProps {
  query: string;
  count: number;
  synthesis: Synthesis;
  queryType: QueryType;
}

const ConfidenceDots = ({ level }: { level: string }) => {
  const filled = level === "alta" ? 5 : level === "média" ? 3 : 1;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i <= filled ? "bg-consensus-accent" : "bg-primary-foreground/20"
          }`}
        />
      ))}
    </div>
  );
};

const ConsensusBar = ({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="text-consensus-text/80">
        {icon} {label}
      </span>
      <span className={`font-bold ${colorClass}`}>{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-primary-foreground/10 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${colorClass.replace("text-", "bg-")}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const ConsensusPanel = ({ query, count, synthesis, queryType }: ConsensusPanelProps) => {
  const headerLabel =
    queryType === "broad"
      ? `Panorama do campo com base em ${count} estudos`
      : queryType === "comparison"
        ? `Comparação com base em ${count} estudos`
        : `Interpretação com base em ${count} estudos científicos`;

  return (
    <div className="bg-gradient-to-br from-consensus-bg-from to-consensus-bg-to rounded-3xl p-6 sm:p-8 shadow-2xl mb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <span className="text-consensus-accent text-xs font-bold uppercase tracking-widest">
            {headerLabel}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 text-primary-foreground">
            "{query}"
          </h2>
          {queryType !== "hypothesis" && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs text-consensus-accent/70 bg-consensus-accent/10 px-3 py-1 rounded-full">
              {queryType === "broad" ? (
                <>
                  <Layers size={12} /> Tema amplo — panorama geral
                </>
              ) : (
                <>
                  <GitCompare size={12} /> Modo comparativo
                </>
              )}
            </span>
          )}
        </div>
        <div className="bg-consensus-accent/20 border border-consensus-accent/30 px-4 py-2 rounded-full flex items-center gap-2 shrink-0">
          <Gauge size={16} className="text-consensus-accent" />
          <span className="text-xs font-bold uppercase text-consensus-accent">
            Confiança {synthesis.confidence_level}
          </span>
        </div>
      </div>

      {/* Sources badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["PubMed", "OpenAlex", "Semantic Scholar"].map((s) => (
          <span
            key={s}
            className="text-[10px] font-semibold text-consensus-text/50 bg-primary-foreground/5 px-2.5 py-1 rounded-full border border-primary-foreground/10"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Direct Answer */}
      <p className="text-base sm:text-lg leading-relaxed text-consensus-text mb-8 p-5 sm:p-6 bg-primary-foreground/5 rounded-2xl border border-primary-foreground/10">
        {synthesis.direct_answer}
      </p>

      {/* Hypothesis: consensus bars */}
      {queryType === "hypothesis" && (
        <div className="space-y-4 mb-8">
          <ConsensusBar label="Estudos concordam" value={synthesis.consensus_agree} icon="✅" colorClass="text-emerald-400" />
          <ConsensusBar label="Inconclusivo" value={synthesis.consensus_inconclusive} icon="⚠️" colorClass="text-amber-400" />
          <ConsensusBar label="Contradizem" value={synthesis.consensus_contradict} icon="❌" colorClass="text-rose-400" />
        </div>
      )}

      {/* Broad: research lines */}
      {queryType === "broad" && synthesis.confidence_reasons?.length > 0 && (
        <div className="grid gap-3 mb-8">
          {synthesis.confidence_reasons.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-primary-foreground/5 rounded-xl p-4 border border-primary-foreground/10"
            >
              <span className="text-lg shrink-0">{["🔬", "📊", "📋", "🧬"][i] || "📌"}</span>
              <p className="text-sm text-consensus-text/90">{r}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comparison: side-by-side */}
      {queryType === "comparison" && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: "Evidência A", pct: synthesis.consensus_agree, colorClass: "text-emerald-400" },
            { label: "Evidência B", pct: synthesis.consensus_contradict, colorClass: "text-sky-400" },
          ].map((item) => (
            <div key={item.label} className="text-center bg-primary-foreground/5 rounded-xl p-5 border border-primary-foreground/10">
              <div className="text-xs text-consensus-text/60 mb-2 font-semibold uppercase">{item.label}</div>
              <div className={`text-3xl font-black ${item.colorClass}`}>{item.pct}%</div>
            </div>
          ))}
        </div>
      )}

      {/* ICM Score */}
      <div className="bg-primary-foreground/5 rounded-2xl p-5 border border-primary-foreground/10 mb-8">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-2xl font-black text-consensus-accent">8.3</span>
            <span className="text-xs text-consensus-text/50">/10</span>
          </div>
          <div>
            <div className="text-xs font-bold text-consensus-text/70 uppercase tracking-wide">
              Índice de Confiança Metodológica (ICM)
            </div>
            <div className="text-[10px] text-consensus-text/50 mt-0.5">
              Muito forte — baseado no tipo e citações dos estudos
            </div>
          </div>
        </div>
      </div>

      {/* Confidence + Insight */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-primary-foreground/5 rounded-xl p-5 border border-primary-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-consensus-text/70 uppercase">Nível de confiança</span>
            <span className="text-xs font-bold text-consensus-accent capitalize">
              {synthesis.confidence_level}
            </span>
          </div>
          <ConfidenceDots level={synthesis.confidence_level} />
          {synthesis.confidence_reasons?.map((r, i) => (
            <p key={i} className="text-xs text-consensus-text/60 mt-2">
              · {r}
            </p>
          ))}
        </div>
        <div className="bg-primary-foreground/5 rounded-xl p-5 border border-primary-foreground/10">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb size={16} className="text-consensus-accent shrink-0 mt-0.5" />
            <span className="text-xs font-bold text-consensus-text/70 uppercase">Insight prático</span>
          </div>
          <p className="text-sm text-consensus-text/90 leading-relaxed">
            {synthesis.practical_insight}
          </p>
        </div>
      </div>

      {/* Search tip for broad queries */}
      {queryType === "broad" && synthesis.search_tip && (
        <div className="flex items-start gap-3 pt-5 border-t border-primary-foreground/10">
          <ArrowRight size={16} className="text-consensus-accent/60 shrink-0 mt-0.5" />
          <p className="text-sm text-consensus-text/70">
            <span className="font-semibold">💡 Dica:</span> {synthesis.search_tip}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConsensusPanel;

import { Gauge, Lightbulb, ArrowRight } from "lucide-react";
import type { Synthesis } from "@/data/mockDatabase";

interface ConsensusPanelProps {
  query: string;
  count: number;
  synthesis: Synthesis;
}

const ConsensusPanel = ({ query, count, synthesis }: ConsensusPanelProps) => {
  return (
    <div className="bg-gradient-to-br from-consensus-bg-from to-consensus-bg-to rounded-3xl p-8 shadow-2xl mb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <span className="text-consensus-accent text-xs font-bold uppercase tracking-widest">
            Interpretação de {count} estudos
          </span>
          <h2 className="text-2xl font-bold mt-1 text-primary-foreground">
            "{query}"
          </h2>
        </div>
        <div className="bg-consensus-accent/20 border border-consensus-accent/30 px-4 py-2 rounded-full flex items-center gap-2 shrink-0">
          <Gauge size={16} className="text-consensus-accent" />
          <span className="text-xs font-bold uppercase text-consensus-accent">
            Confiança {synthesis.confidence_level}
          </span>
        </div>
      </div>

      <p className="text-lg leading-relaxed text-consensus-text mb-8 p-6 bg-primary-foreground/5 rounded-2xl border border-primary-foreground/10">
        {synthesis.direct_answer}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center">
          <div className="text-2xl font-black text-consensus-accent">{synthesis.consensus_agree}%</div>
          <div className="text-[10px] uppercase font-bold text-consensus-accent/80">Concordam</div>
        </div>
        <div className="text-center border-x border-primary-foreground/10">
          <div className="text-2xl font-black text-amber-400">{synthesis.consensus_inconclusive}%</div>
          <div className="text-[10px] uppercase font-bold text-amber-300/80">Inconclusivo</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-rose-400">{synthesis.consensus_contradict}%</div>
          <div className="text-[10px] uppercase font-bold text-rose-300/80">Contradizem</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-6 border-t border-primary-foreground/10">
        <div className="flex items-start gap-3 text-sm text-consensus-text">
          <Lightbulb className="text-consensus-accent shrink-0 mt-0.5" size={18} />
          <p>
            <span className="font-bold">Insight:</span> {synthesis.practical_insight}
          </p>
        </div>
        <div className="flex items-start gap-3 text-sm text-consensus-text/70">
          <ArrowRight className="text-consensus-accent/60 shrink-0 mt-0.5" size={18} />
          <p>{synthesis.search_tip}</p>
        </div>
      </div>
    </div>
  );
};

export default ConsensusPanel;

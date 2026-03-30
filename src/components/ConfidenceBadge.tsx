import { useState } from "react";
import {
  getConfidenceLabel,
  getConfidenceColor,
  getConfidenceExplanation,
  ConfidenceFactors,
} from "@/lib/confidenceScore";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface ConfidenceBadgeProps {
  score: number;
  factors: ConfidenceFactors;
}

export const ConfidenceBadge = ({ score, factors }: ConfidenceBadgeProps) => {
  const [open, setOpen] = useState(false);
  const label = getConfidenceLabel(score);
  const colorClass = getConfidenceColor(score);
  const explanations = getConfidenceExplanation(factors);

  const getIcon = () => {
    if (score >= 50) return <CheckCircle2 className="w-3.5 h-3.5" />;
    return <AlertCircle className="w-3.5 h-3.5" />;
  };

  const bgColor =
    score >= 80 ? "bg-green-50 dark:bg-green-950/30" :
    score >= 65 ? "bg-green-50 dark:bg-green-950/30" :
    score >= 50 ? "bg-yellow-50 dark:bg-yellow-950/30" :
    score >= 35 ? "bg-orange-50 dark:bg-orange-950/30" :
    "bg-red-50 dark:bg-red-950/30";

  const borderColor =
    score >= 80 ? "border-green-200 dark:border-green-800" :
    score >= 65 ? "border-green-200 dark:border-green-800" :
    score >= 50 ? "border-yellow-200 dark:border-yellow-800" :
    score >= 35 ? "border-orange-200 dark:border-orange-800" :
    "border-red-200 dark:border-red-800";

  const textColor =
    score >= 80 ? "text-green-700 dark:text-green-300" :
    score >= 65 ? "text-green-700 dark:text-green-300" :
    score >= 50 ? "text-yellow-700 dark:text-yellow-300" :
    score >= 35 ? "text-orange-700 dark:text-orange-300" :
    "text-red-700 dark:text-red-300";

  const iconColor =
    score >= 80 ? "text-green-600 dark:text-green-400" :
    score >= 65 ? "text-green-600 dark:text-green-400" :
    score >= 50 ? "text-yellow-600 dark:text-yellow-400" :
    score >= 35 ? "text-orange-600 dark:text-orange-400" :
    "text-red-600 dark:text-red-400";

  const panelBg =
    score >= 80 ? "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800" :
    score >= 65 ? "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800" :
    score >= 50 ? "bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800" :
    score >= 35 ? "bg-orange-50/80 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800" :
    "bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-800";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border
          ${bgColor} ${borderColor} cursor-pointer
          transition-all hover:opacity-80 active:scale-95
        `}
      >
        <div className={iconColor}>{getIcon()}</div>
        <div className="flex flex-col text-left">
          <span className={`text-xs font-semibold ${textColor}`}>Confiabilidade</span>
          <span className={`text-xs font-bold ${textColor}`}>{score}/100 · {label}</span>
        </div>
        <div className={`ml-1 ${iconColor}`}>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {open && (
        <div className={`mt-2 rounded-xl border p-4 space-y-3 ${panelBg}`}>
          <div className={`text-sm font-semibold ${textColor}`}>
            Score: {score}/100 · {label}
          </div>
          <div className="flex w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
            <div
              className={`${colorClass} transition-all rounded-full`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="space-y-1.5">
            <div className={`text-xs font-semibold ${textColor} mb-1`}>Critérios de Avaliação:</div>
            {explanations.map((exp, idx) => (
              <div key={idx} className={`text-xs ${textColor} opacity-90`}>
                {exp}
              </div>
            ))}
          </div>
          <div className={`text-[10px] ${textColor} opacity-60 pt-2 border-t border-current/10`}>
            Pesos: Tipo de Estudo (30%) · Fonte (25%) · Peer-Review (20%) · Recência (15%) · Citações (10%)
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfidenceBadge;

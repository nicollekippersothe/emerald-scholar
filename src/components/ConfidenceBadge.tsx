import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  getConfidenceLabel, 
  getConfidenceColor,
  getConfidenceExplanation,
  ConfidenceFactors,
} from "@/lib/confidenceScore";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

interface ConfidenceBadgeProps {
  score: number;
  factors: ConfidenceFactors;
}

export const ConfidenceBadge = ({ score, factors }: ConfidenceBadgeProps) => {
  const label = getConfidenceLabel(score);
  const colorClass = getConfidenceColor(score);
  const explanations = getConfidenceExplanation(factors);

  // Visual indicator icon
  const getIcon = () => {
    if (score >= 80) return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (score >= 65) return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (score >= 50) return <AlertCircle className="w-3.5 h-3.5" />;
    return <AlertCircle className="w-3.5 h-3.5" />;
  };

  // Semantic color mapping
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border
          ${bgColor} ${borderColor} cursor-help
          transition-all hover:opacity-80
        `}>
          <div className={`${iconColor}`}>
            {getIcon()}
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-semibold ${textColor}`}>
              Confiabilidade
            </span>
            <span className={`text-xs font-bold ${textColor}`}>
              {score}/100 · {label}
            </span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-2">
          <div className="font-semibold text-sm">
            Score: {score}/100 · {label}
          </div>
          <div className="flex w-full bg-foreground/20 rounded h-2 overflow-hidden">
            <div
              className={`${colorClass} transition-all`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="text-xs space-y-1 mt-3">
            <div className="font-semibold text-foreground mb-2">Critérios de Avaliação:</div>
            {explanations.map((exp, idx) => (
              <div key={idx} className="text-foreground/90">
                {exp}
              </div>
            ))}
          </div>
          <div className="text-xs text-foreground/70 mt-3 pt-2 border-t border-foreground/10">
            Pesos: Tipo de Estudo (30%) · Fonte (25%) · Peer-Review (20%) · Recência (15%) · Citações (10%)
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default ConfidenceBadge;

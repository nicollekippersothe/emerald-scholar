import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { type Synthesis } from "@/data/mockDatabase";

interface ConsensusModuleProps {
  synthesis: Synthesis;
  query: string;
}

export const ConsensusModule = ({ synthesis, query }: ConsensusModuleProps) => {
  const total = 
    synthesis.consensus_agree + 
    synthesis.consensus_inconclusive + 
    synthesis.consensus_contradict;

  // Calculate percentages
  const agreePercent = total > 0 ? Math.round((synthesis.consensus_agree / total) * 100) : 0;
  const inconclusivePercent = total > 0 ? Math.round((synthesis.consensus_inconclusive / total) * 100) : 0;
  const contradictPercent = total > 0 ? Math.round((synthesis.consensus_contradict / total) * 100) : 0;

  // Determine the verdict (which group is dominant)
  const getVerdict = () => {
    if (agreePercent >= 60) {
      return {
        label: "Consenso: Concordam",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-green-200 dark:border-green-800",
        icon: CheckCircle2,
        description: `${agreePercent}% dos estudos concordam com a proposição`,
      };
    }
    if (contradictPercent >= 60) {
      return {
        label: "Consenso: Discordam",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-200 dark:border-red-800",
        icon: AlertCircle,
        description: `${contradictPercent}% dos estudos contradizem a proposição`,
      };
    }
    return {
      label: "Resultado: Inconclusivo",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      icon: HelpCircle,
      description: `Distribuição equilibrada: não há consenso claro`,
    };
  };

  const verdict = getVerdict();
  const VerdictIcon = verdict.icon;

  return (
    <div className="space-y-6">
      {/* Main Verdict Card */}
      <div
        className={`
          rounded-2xl border p-6
          ${verdict.bgColor} ${verdict.borderColor}
        `}
      >
        <div className="flex items-start gap-3 mb-3">
          <VerdictIcon className={`w-6 h-6 mt-1 flex-shrink-0 ${verdict.color}`} />
          <div>
            <h3 className={`font-bold text-lg ${verdict.color}`}>
              {verdict.label}
            </h3>
            <p className="text-sm text-foreground/70 mt-1">
              {verdict.description}
            </p>
          </div>
        </div>

        {/* Confidence level info */}
        <div className="mt-4 p-3 bg-foreground/5 rounded-lg">
          <div className={`text-xs font-semibold ${verdict.color} mb-2`}>
            Nível de Confiança
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-foreground/10 rounded-full h-3 overflow-hidden">
              <div
                className={`
                  h-full transition-all
                  ${synthesis.confidence_score >= 80 ? "bg-green-500" : 
                    synthesis.confidence_score >= 65 ? "bg-green-400" :
                    synthesis.confidence_score >= 50 ? "bg-yellow-500" :
                    synthesis.confidence_score >= 35 ? "bg-orange-500" :
                    "bg-red-500"}
                `}
                style={{ width: `${synthesis.confidence_score}%` }}
              />
            </div>
            <span className="text-xs font-bold whitespace-nowrap">
              {synthesis.confidence_score}/100
            </span>
          </div>
          <div className="text-xs text-foreground/60 mt-2">
            {synthesis.confidence_level}
          </div>
        </div>
      </div>

      {/* Consensus Distribution */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">Distribuição de Estudos</h4>

        {/* Agree Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Concordam</span>
            </div>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {synthesis.consensus_agree} ({agreePercent}%)
            </span>
          </div>
          <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all"
              style={{ width: `${agreePercent}%` }}
            />
          </div>
        </div>

        {/* Inconclusive Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">Inconclusivos</span>
            </div>
            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
              {synthesis.consensus_inconclusive} ({inconclusivePercent}%)
            </span>
          </div>
          <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-yellow-500 h-full transition-all"
              style={{ width: `${inconclusivePercent}%` }}
            />
          </div>
        </div>

        {/* Contradict Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium">Discordam</span>
            </div>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
              {synthesis.consensus_contradict} ({contradictPercent}%)
            </span>
          </div>
          <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all"
              style={{ width: `${contradictPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-foreground/5 rounded-lg p-4 space-y-3">
        {synthesis.confidence_reasons && synthesis.confidence_reasons.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-foreground/70 uppercase mb-2">
              Razões da Confiança
            </h5>
            <ul className="space-y-1">
              {synthesis.confidence_reasons.map((reason, idx) => (
                <li key={idx} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {agreePercent < 60 && inconclusivePercent > 0 && (
          <div>
            <h5 className="text-xs font-bold text-foreground/70 uppercase mb-2">
              Por que inconclusivo?
            </h5>
            <p className="text-sm text-foreground/80">
              {synthesis.inconclusive_summary}
            </p>
          </div>
        )}

        {contradictPercent > 0 && contradictPercent < 60 && (
          <div>
            <h5 className="text-xs font-bold text-foreground/70 uppercase mb-2">
              Estudos que discordam
            </h5>
            <p className="text-sm text-foreground/80">
              {synthesis.contradict_explanation}
            </p>
          </div>
        )}

        {synthesis.practical_insight && (
          <div>
            <h5 className="text-xs font-bold text-foreground/70 uppercase mb-2">
              ✨ Aplicação Prática
            </h5>
            <p className="text-sm text-foreground/80">
              {synthesis.practical_insight}
            </p>
          </div>
        )}

        {synthesis.search_tip && (
          <div>
            <h5 className="text-xs font-bold text-foreground/70 uppercase mb-2">
              💡 Dica de Busca
            </h5>
            <p className="text-sm text-foreground/80">
              {synthesis.search_tip}
            </p>
          </div>
        )}
      </div>

      {/* Research Recortes (if available) */}
      {synthesis.study_recortes && synthesis.study_recortes.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Perspectivas de Pesquisa</h4>
          <div className="grid gap-2">
            {synthesis.study_recortes.map((recorte, idx) => (
              <div
                key={idx}
                className="text-xs bg-foreground/5 border border-foreground/10 rounded-lg p-3 text-foreground/80"
              >
                {recorte}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsensusModule;

import { useState } from "react";
import { X, CheckCircle2, Copy, Check } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  disabled: boolean;
  code: string;
  highlight?: boolean;
  contactLink?: string;
};

const PLANS: Plan[] = [
  { name: "Gratuito", price: "R$ 0", period: "/mês", features: ["3 buscas/dia", "Resumo básico", "Referência ABNT", "11 bases simultâneas", "Salvar artigos"], cta: "Plano atual", disabled: true, code: "" },
  { name: "Estudante", price: "R$ 6,00", period: "/mês", features: ["30 buscas/dia", "Consenso completo", "Referência ABNT", "11 bases simultâneas", "Análise de consenso", "Índice de confiabilidade", "Salvar artigos"], cta: "Assinar Estudante", disabled: false, code: "SCHOLAR-EST-2024", highlight: false },
  { name: "Pesquisador", price: "R$ 26,00", period: "/mês", features: ["Buscas ilimitadas", "Todas as análises", "Referência ABNT", "11 bases + arXiv preprints", "Análise de consenso avançada", "Índice de confiabilidade", "Salvar artigos ilimitados", "Acesso antecipado a novos recursos"], cta: "Assinar Pesquisador", disabled: false, code: "SCHOLAR-PRO-2024", highlight: true },
];

const PlansModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [copiedCode, setCopiedCode] = useState("");
  if (!open) return null;

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-foreground/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Planos Scholar<span className="text-primary">IA</span></h2>
            <p className="text-sm text-muted-foreground mt-1">Escolha o plano ideal para sua pesquisa</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-foreground/5 transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-5 border ${
                plan.highlight
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-foreground/10 bg-card/40"
              }`}
            >
              {plan.highlight && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3 inline-block">
                  MAIS POPULAR
                </span>
              )}
              <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground/70">
                    <CheckCircle2 size={12} className="text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.code && (
                <div className="mb-3 p-2 bg-foreground/[0.03] rounded-lg border border-foreground/5">
                  <span className="text-[10px] text-muted-foreground block mb-1">Código promocional:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs font-mono text-primary font-bold">{plan.code}</code>
                    <button onClick={() => copyCode(plan.code)} className="text-muted-foreground hover:text-primary transition-colors">
                      {copiedCode === plan.code ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}
              {plan.contactLink ? (
                <a
                  href={plan.contactLink}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all bg-foreground/10 text-foreground hover:bg-foreground/20 active:scale-[0.98] block text-center"
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  disabled={plan.disabled}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                    plan.disabled
                      ? "bg-foreground/5 text-muted-foreground cursor-not-allowed"
                      : plan.highlight
                      ? "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"
                      : "bg-foreground/10 text-foreground hover:bg-foreground/20 active:scale-[0.98]"
                  }`}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlansModal;

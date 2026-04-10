import { useState } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  disabled: boolean;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  { id: "free",        name: "Gratuito",    price: "R$ 0",     period: "/mês", features: ["3 buscas/dia", "Resumo básico", "Referência ABNT", "13 bases simultâneas", "Salvar artigos"], cta: "Plano atual", disabled: true },
  { id: "estudante",   name: "Estudante",   price: "R$ 6,00",  period: "/mês", features: ["30 buscas/dia", "Consenso completo", "Referência ABNT", "13 bases simultâneas", "Análise de consenso", "Índice de confiabilidade", "Salvar artigos"], cta: "Assinar Estudante", disabled: false },
  { id: "pesquisador", name: "Pesquisador", price: "R$ 26,00", period: "/mês", features: ["Buscas ilimitadas", "Todas as análises", "Referência ABNT", "13 bases + arXiv preprints", "Análise de consenso avançada", "Índice de confiabilidade", "Salvar artigos ilimitados", "Acesso antecipado a novos recursos"], cta: "Assinar Pesquisador", disabled: false, highlight: true },
];

const PlansModal = ({
  open,
  onClose,
  userId,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
}) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  if (!open) return null;

  const handleCheckout = async (planId: string) => {
    setCheckoutError(null);
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, userId, email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? "Erro ao iniciar pagamento.");
        setLoadingPlan(null);
        return;
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setCheckoutError("Não foi possível conectar ao servidor de pagamentos.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-foreground/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Planos Clar<span className="text-primary">a</span></h2>
            <p className="text-sm text-muted-foreground mt-1">Escolha o plano ideal para sua pesquisa</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-foreground/5 transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {checkoutError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {checkoutError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
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
              <button
                disabled={plan.disabled || loadingPlan === plan.id}
                onClick={() => !plan.disabled && handleCheckout(plan.id)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  plan.disabled
                    ? "bg-foreground/5 text-muted-foreground cursor-not-allowed"
                    : plan.highlight
                    ? "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"
                    : "bg-foreground/10 text-foreground hover:bg-foreground/20 active:scale-[0.98]"
                }`}
              >
                {loadingPlan === plan.id && <Loader2 size={14} className="animate-spin" />}
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-[10px] text-muted-foreground/50">
          Pagamento seguro via Stripe · Cancele a qualquer momento · LGPD compliant
        </p>
      </div>
    </div>
  );
};

export default PlansModal;

import { useState } from "react";
import { X, Tag, CheckCircle2, Lock } from "lucide-react";

interface PromoCodeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  featureName?: string;
}

const PromoCodeModal = ({ open, onClose, onSuccess, featureName = "este recurso" }: PromoCodeModalProps) => {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  if (!open) return null;

  const handleApply = () => {
    if (!code.trim()) {
      setStatus("error");
      return;
    }
    // Qualquer código não-vazio é aceito (lógica mock)
    setStatus("success");
    setTimeout(() => {
      onSuccess();
      onClose();
      setCode("");
      setStatus("idle");
    }, 1200);
  };

  const handleClose = () => {
    setCode("");
    setStatus("idle");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-background border border-foreground/10 rounded-3xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Lock size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-extrabold text-foreground text-base">Acesso restrito</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Insira um código para liberar {featureName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-foreground/5 transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setStatus("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="Ex: SCHOLAR-EST-2024"
              className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-mono font-semibold bg-card text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors ${
                status === "error"
                  ? "border-destructive focus:ring-1 focus:ring-destructive"
                  : status === "success"
                  ? "border-green-500 focus:ring-1 focus:ring-green-500"
                  : "border-border focus:ring-1 focus:ring-primary"
              }`}
            />
          </div>

          {status === "error" && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              ⚠️ Digite um código para continuar.
            </p>
          )}

          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <CheckCircle2 size={16} />
              <span className="font-semibold">Acesso liberado! Aproveite.</span>
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={status === "success"}
            className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "success" ? "✓ Código aplicado" : "Aplicar código"}
          </button>

          <div className="bg-foreground/[0.03] border border-foreground/5 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-2 font-semibold">Códigos de demonstração disponíveis:</p>
            {[
              { label: "Estudante", code: "SCHOLAR-EST-2024" },
              { label: "Pesquisador", code: "SCHOLAR-PRO-2024" },
            ].map(({ label, code }) => (
              <div key={code} className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <button
                  onClick={() => { setCode(code); setStatus("idle"); }}
                  className="text-[10px] font-mono font-bold text-primary hover:underline"
                >
                  {code}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Não tem um código?{" "}
            <button
              onClick={handleClose}
              className="text-primary hover:underline"
            >
              Ver planos disponíveis
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeModal;

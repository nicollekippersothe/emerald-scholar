import { useState } from "react";
import { X, MessageSquarePlus, CheckCircle2, Bug, Lightbulb, HelpCircle } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const TYPES = [
  { id: "bug", label: "Bug", icon: Bug, color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  { id: "sugestao", label: "Sugestão", icon: Lightbulb, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "outro", label: "Outro", icon: HelpCircle, color: "text-primary border-primary/30 bg-primary/10" },
] as const;

type FeedbackType = typeof TYPES[number]["id"];

const FeedbackModal = ({ open, onClose }: FeedbackModalProps) => {
  const [type, setType] = useState<FeedbackType>("sugestao");
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSubmit = () => {
    if (!text.trim()) return;
    setSending(true);
    // Simulated send — in production replace with fetch() to backend or a form service
    setTimeout(() => {
      console.log("[Emerald Scholar Feedback]", { type, text, email });
      setSending(false);
      setSent(true);
    }, 900);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setText("");
      setEmail("");
      setType("sugestao");
      setSent(false);
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-background border border-foreground/10 rounded-3xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <MessageSquarePlus size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-extrabold text-foreground text-base">Feedback & Suporte</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Versão demonstrativa · Emerald Scholar BETA</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-foreground/5 transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div className="bg-emerald-500/10 p-4 rounded-2xl">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-foreground mb-1">Obrigado pelo feedback!</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sua mensagem foi registrada. Cada contribuição nos ajuda a construir uma ferramenta melhor para pesquisadores.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 transition-all"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pitch text */}
            <p className="text-sm text-muted-foreground leading-relaxed bg-foreground/[0.03] rounded-xl p-3 border border-foreground/5">
              Estamos em constante evolução. Encontrou um bug ou tem uma sugestão?{" "}
              <span className="text-foreground/80 font-medium">Ajude-nos a melhorar o Emerald Scholar.</span>
            </p>

            {/* Type selector */}
            <div>
              <p className="text-xs font-semibold text-foreground/70 mb-2">Tipo de feedback</p>
              <div className="flex gap-2">
                {TYPES.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => setType(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      type === id ? color : "border-foreground/10 text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-foreground/70 mb-2">Sua mensagem *</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "Descreva o que aconteceu e em qual busca/aba ocorreu..."
                    : type === "sugestao"
                    ? "Qual funcionalidade ou melhoria você gostaria de ver?"
                    : "Como podemos ajudar?"
                }
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary outline-none resize-none"
              />
            </div>

            {/* Email (optional) */}
            <div>
              <p className="text-xs font-semibold text-foreground/70 mb-2">E-mail para resposta <span className="text-muted-foreground/50 font-normal">(opcional)</span></p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!text.trim() || sending}
              className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Enviando..." : "Enviar feedback"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;

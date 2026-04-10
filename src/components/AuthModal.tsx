import { useState, type FormEvent } from "react";
import { X, BrainCircuit, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** If set, shown as a reason why the modal was triggered */
  reason?: "searches_exhausted" | "save_article" | "default";
}

const REASON_MESSAGES: Record<string, string> = {
  searches_exhausted: "Suas buscas gratuitas acabaram. Crie uma conta gratuita para continuar.",
  save_article: "Faça login para salvar artigos entre sessões.",
  default: "Entre ou crie sua conta gratuita.",
};

export default function AuthModal({ open, onClose, reason = "default" }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fn = mode === "login" ? signIn : signUp;
    const err = await fn(email, password);

    setLoading(false);
    if (err) {
      // Translate common Supabase errors to Portuguese
      if (err.includes("Invalid login")) setError("Email ou senha incorretos.");
      else if (err.includes("already registered")) setError("Este email já está cadastrado. Faça login.");
      else if (err.includes("Password should be")) setError("Senha deve ter pelo menos 6 caracteres.");
      else if (err.includes("not configured")) setError("Autenticação não configurada neste ambiente.");
      else setError(err);
    } else if (mode === "signup") {
      setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-foreground/10 rounded-3xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-primary" />
            <span className="font-extrabold text-foreground">
              Clar<span className="text-primary">a</span>
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Reason banner */}
        {reason !== "default" && (
          <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            {REASON_MESSAGES[reason]}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 mb-5">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        {success ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-2xl">📬</p>
            <p className="text-sm font-semibold text-foreground">{success}</p>
            <button onClick={onClose} className="mt-3 text-xs text-primary underline">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-muted/40 border border-foreground/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted/40 border border-foreground/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta gratuita"}
            </button>

            {mode === "login" && (
              <p className="text-center text-[11px] text-muted-foreground">
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="text-primary underline font-medium"
                >
                  Criar agora — é grátis
                </button>
              </p>
            )}
          </form>
        )}

        <p className="mt-4 text-center text-[10px] text-muted-foreground/50">
          Ao continuar, você aceita nossos{" "}
          <a href="/termos" className="underline hover:text-muted-foreground">Termos</a>
          {" "}e{" "}
          <a href="/privacidade" className="underline hover:text-muted-foreground">Privacidade</a>.
        </p>
      </div>
    </div>
  );
}

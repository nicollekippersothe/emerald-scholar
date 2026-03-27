import { X, Hammer, Search, Sparkles } from "lucide-react";

const EXAMPLE_SEARCHES = [
  "microbiota intestinal e saúde mental: revisão sistemática",
  "CRISPR-Cas9 eficácia em doenças monogênicas em humanos",
  "terapia cognitivo-comportamental reduz ansiedade generalizada?",
  "impacto do isolamento social em adolescentes pós-pandemia",
];

interface DevModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (term: string) => void;
}

const DevModal = ({ open, onClose, onSearch }: DevModalProps) => {
  if (!open) return null;

  const handleSearch = (term: string) => {
    onClose();
    onSearch(term);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-foreground/10 rounded-3xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Hammer size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-foreground text-base">Recurso em Desenvolvimento</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Análise completa de PDF · Em breve</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-foreground/5 transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200 leading-relaxed">
            A análise completa de PDFs — com extração de amostra, p-valor, conflitos de interesse e limitações — está em desenvolvimento ativo e será liberada em breve para assinantes.
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Enquanto isso, tente uma busca por tema:
              </p>
            </div>
            <div className="space-y-2">
              {EXAMPLE_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl border border-foreground/10 hover:border-primary/30 bg-card/40 hover:bg-card/80 transition-all group"
                >
                  <Search size={12} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  <span className="text-xs text-foreground/70 group-hover:text-foreground transition-colors leading-relaxed">
                    {s}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold border border-foreground/10 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevModal;

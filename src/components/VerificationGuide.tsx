import { useState } from "react";
import { Shield, ChevronDown } from "lucide-react";

const STEPS = [
  { n: 1, icon: "🔗", title: "Acesse o DOI ou link do artigo", desc: "Confirme que o artigo existe e que título, autores e ano batem com o que aparece aqui." },
  { n: 2, icon: "📋", title: "Confira a referência ABNT", desc: "Compare com o artigo original. A IA pode errar em nomes, volume ou páginas." },
  { n: 3, icon: "🔍", title: "Verifique o periódico no Qualis CAPES", desc: "Acesse sucupira.capes.gov.br e confira a classificação para sua área (A1 a C)." },
  { n: 4, icon: "📖", title: "Leia o abstract original", desc: "O resumo gerado pela IA é uma simplificação. Sempre leia o original antes de citar." },
];

const VerificationGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-primary shrink-0" />
          <div className="text-left">
            <span className="text-sm font-bold text-foreground">
              Como verificar um artigo antes de citar
            </span>
            <span className="ml-2 text-[10px] font-semibold bg-[hsl(var(--warn-bg))] text-[hsl(var(--warn-text))] px-2 py-0.5 rounded">
              ⚠️ IA pode errar
            </span>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 border-t border-border pt-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Resumos, referências e metadados são gerados por IA e podem conter imprecisões.
            Siga os passos abaixo antes de usar qualquer artigo em um trabalho acadêmico.
          </p>
          <div className="space-y-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {s.n}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-foreground">
                    {s.icon} {s.title}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationGuide;

import { useState, useRef, useEffect } from "react";
import { ExternalLink, ChevronDown, Copy, Check, MessageCircle, Bookmark, BookmarkCheck, Unlock } from "lucide-react";
import type { Article } from "@/data/mockDatabase";
import { STUDY_TYPE_MAP, EVIDENCE_LABELS } from "@/data/mockDatabase";

interface ArticleCardProps {
  article: Article;
  index: number;
  saved: boolean;
  onSave: (article: Article) => void;
}

const ScoreBar = ({ score }: { score: number }) => {
  const s = Math.min(5, Math.max(1, score));
  const scoreColors = [
    "bg-muted",
    "bg-muted",
    "bg-[hsl(var(--score-limited))]",
    "bg-[hsl(var(--score-moderate))]",
    "bg-[hsl(var(--score-good))]",
    "bg-[hsl(var(--score-strong))]",
  ];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-5 h-1.5 rounded-full transition-colors ${
              i <= s ? scoreColors[s] : "bg-border"
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">
        {s}/5 · {EVIDENCE_LABELS[s] || ""}
      </span>
    </div>
  );
};

const StudyBadge = ({ type }: { type: string }) => {
  const k = type.toLowerCase().trim();
  const info = STUDY_TYPE_MAP[k];
  if (!info) return <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">{type}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
      {info.icon} {info.label}
    </span>
  );
};

const QUICK_QUESTIONS = [
  "Explica este estudo de forma simples",
  "Quais são as limitações?",
  "Esta fonte é confiável para citar?",
  "Como verificar este artigo?",
];

const ArticleCard = ({ article, index, saved, onSave }: ArticleCardProps) => {
  const [expanded, setExpanded] = useState(index === 0);
  const [copiedAbnt, setCopiedAbnt] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [msgs, setMsgs] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const getMockAnswer = (q: string): string => {
    const answers: Record<string, string> = {
      "Explica este estudo de forma simples": `Este é um ${article.study_type || "estudo"} de ${article.year} na ${article.journal}. ${article.abstract_pt}`,
      "Quais são as limitações?": `${article.evidence_reason}${article.potential_bias && article.potential_bias !== "Nenhum identificado" ? " Viés identificado: " + article.potential_bias : ""}`,
      "Esta fonte é confiável para citar?": `Score ${article.evidence_score}/5. ${article.expert_reviewed ? "✓ Avaliado por pares." : "⚠️ Não avaliado por pares."} ${article.citations} citações em ${article.journal} (${article.year}). Confirme pelo DOI antes de citar.`,
      "Como verificar este artigo?": `Acesse doi.org/${article.doi || "[DOI no artigo]"}, compare os dados com o original, leia o abstract e confira o periódico no Qualis CAPES.`,
    };
    return answers[q] || `Com base nos dados de "${article.title}": ${article.abstract_pt || "Acesse o artigo original pelo DOI para mais detalhes."}`;
  };

  const sendMessage = async (q?: string) => {
    const m = (q || chatInput).trim();
    if (!m) return;
    setChatInput("");
    setMsgs((prev) => [...prev, { role: "user", text: m }]);
    setChatLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setMsgs((prev) => [...prev, { role: "ai", text: getMockAnswer(m) }]);
    setChatLoading(false);
  };

  const copyAbnt = () => {
    navigator.clipboard?.writeText(article.abnt);
    setCopiedAbnt(true);
    setTimeout(() => setCopiedAbnt(false), 2000);
  };

  return (
    <div
      className="bg-card rounded-2xl shadow-sm border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {article.year && (
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {article.year}
              </span>
            )}
            <span className="text-[10px] font-medium text-muted-foreground">
              {article.journal}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              via {article.source}
            </span>
            {article.is_oa && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                <Unlock size={10} /> Acesso aberto
              </span>
            )}
          </div>
          <h4 className="font-bold text-foreground mb-1.5 leading-tight text-sm sm:text-base">
            {article.title}
          </h4>
          <p className="text-xs text-muted-foreground">
            {article.authors}
            {article.citations > 0 && ` · ${article.citations.toLocaleString()} citações`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(article);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              saved
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/20"
            }`}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          </button>
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 sm:px-6 pb-6 border-t border-border pt-5 space-y-5">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {article.expert_reviewed ? "✓ Avaliado por especialistas" : "⏳ Não avaliado"}
            </span>
            {article.study_type && <StudyBadge type={article.study_type} />}
            {article.citations > 0 && (
              <span className="text-[10px] text-muted-foreground">
                📎 {article.citations.toLocaleString()} citações
              </span>
            )}
          </div>

          {/* Evidence score */}
          <ScoreBar score={article.evidence_score} />

          {/* Bias warning */}
          {article.potential_bias && article.potential_bias !== "Nenhum identificado" && (
            <div className="bg-[hsl(var(--warn-bg))] border border-[hsl(var(--warn-border))] rounded-xl p-3 text-xs text-[hsl(var(--warn-text))]">
              ⚠️ Conflito ou viés: {article.potential_bias}
            </div>
          )}

          {/* Abstract */}
          <div className="space-y-3">
            <div>
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                💬 Resumo simplificado
              </h5>
              <p className="text-sm text-foreground/80 leading-relaxed bg-muted/50 rounded-xl p-4 italic">
                "{article.abstract_pt}"
              </p>
            </div>
            {article.evidence_reason && (
              <div>
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  🔬 Por que esta evidência importa
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-xl p-4">
                  {article.evidence_reason}
                </p>
              </div>
            )}
          </div>

          {/* ABNT Reference */}
          {article.abnt && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Referência ABNT
                </h5>
                <button
                  onClick={copyAbnt}
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    copiedAbnt
                      ? "border-[hsl(var(--success-border))] bg-[hsl(var(--success-bg))] text-[hsl(var(--success-text))]"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {copiedAbnt ? <Check size={10} /> : <Copy size={10} />}
                  {copiedAbnt ? "Copiado" : "Copiar"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded-xl p-4 leading-relaxed break-all">
                {article.abnt}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={`https://doi.org/${article.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <ExternalLink size={12} /> Ver artigo
            </a>
            {article.doi && (
              <a
                href={`https://doi.org/${article.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                🔗 DOI
              </a>
            )}
            {article.is_oa && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-primary/20 text-primary bg-primary/5">
                📄 PDF disponível
              </span>
            )}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                showChat
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <MessageCircle size={12} /> Perguntar à IA
            </button>
          </div>

          {/* Chat */}
          {showChat && (
            <div className="bg-muted/30 rounded-2xl p-4 border border-border space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle size={14} className="text-primary" />
                <span className="font-semibold">Perguntar sobre este artigo</span>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">respostas simuladas</span>
              </div>

              {msgs.length === 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-[11px] px-3 py-1.5 rounded-lg border border-border bg-card text-foreground/80 hover:bg-muted transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {msgs.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {msgs.map((m, i) => (
                    <div
                      key={i}
                      className={`text-xs p-3 rounded-xl leading-relaxed ${
                        m.role === "user"
                          ? "bg-[hsl(var(--chat-user-bg))] text-foreground ml-8"
                          : "bg-[hsl(var(--chat-ai-bg))] text-foreground/80 mr-8"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-1 p-3">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Faça uma pergunta sobre este artigo..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
                />
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.97] transition-all"
                >
                  Enviar
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArticleCard;

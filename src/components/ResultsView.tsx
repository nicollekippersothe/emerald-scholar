import { type FormEvent, useState, useRef, useEffect } from "react";
import {
  BrainCircuit,
  ArrowRight,
  Search,
  Target,
  Lightbulb,
  Zap,
  Clock,
  Bot,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  BookOpen,
  FileText,
  ClipboardCheck,
  FileSearch,
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Download,
  BarChart3,
  Link2,
  MessageCircle,
  Loader2,
} from "lucide-react";
import PlansModal from "@/components/PlansModal";
import { type MockEntry, type Article, STUDY_TYPE_MAP, EVIDENCE_LABELS, CONFIDENCE_EXPLANATIONS, SOURCE_LIST } from "@/data/mockDatabase";

const SC_BADGES = [
  { name: "PubMed", color: "#EF4444" },
  { name: "OpenAlex", color: "#3B82F6" },
  { name: "Semantic Scholar", color: "#A78BFA" },
  { name: "CrossRef", color: "#2DD4BF" },
  { name: "DOAJ", color: "#38BDF8" },
  { name: "SciELO", color: "#22C55E" },
  { name: "arXiv", color: "#F97316" },
  { name: "Europe PMC", color: "#E11D48" },
  { name: "BASE", color: "#8B5CF6" },
  { name: "Lens.org", color: "#06B6D4" },
  { name: "CORE", color: "#D97706" },
];

const TABS = [
  { id: "search", label: "Pesquisar", icon: Search, count: null },
  { id: "analysis", label: "Análises", icon: BarChart3, count: null },
  { id: "references", label: "Referências", icon: FileText, count: null },
  { id: "audit", label: "Auditoria", icon: ClipboardCheck, count: 1 },
  { id: "split", label: "Split PDF", icon: FileSearch, count: null },
];

const VERIFICATION_STEPS = [
  { n: 1, icon: "🔗", title: "Acesse o DOI ou link do artigo", desc: "Confirme que o artigo existe e que título, autores e ano batem com o que aparece aqui. DOIs falsos ou incorretos são um dos erros mais comuns de IA." },
  { n: 2, icon: "📋", title: "Confira a referência ABNT gerada", desc: "Compare cada campo (autores, título, periódico, volume, páginas, ano) com o artigo original. A IA pode inverter nomes, errar volumes ou inventar páginas." },
  { n: 3, icon: "🔍", title: "Verifique o periódico no Qualis CAPES", desc: "Acesse sucupira.capes.gov.br e confira a classificação do periódico para sua área (A1 a C). Periódicos predatórios podem aparecer nos resultados." },
  { n: 4, icon: "📖", title: "Leia o abstract original", desc: "O resumo em português é uma tradução/simplificação feita por IA. Sempre leia o abstract original em inglês no site do periódico antes de citar em trabalho acadêmico." },
];

const QUICK_QUESTIONS = [
  "Explica este estudo de forma simples",
  "Quais são as limitações?",
  "Esta fonte é confiável para citar?",
  "Como verificar este artigo?",
];

interface ResultsViewProps {
  query: string;
  result: MockEntry;
  searchesLeft: number;
  onQueryChange: (q: string) => void;
  onSubmit: (e: FormEvent) => void;
  onSearch: (term: string) => void;
  onBack: () => void;
}

/* ── Hallucination-filtered chat answer ── */
const getContextualAnswer = (q: string, article: Article): string => {
  const abstract = article.abstract_pt || "";
  const ql = q.toLowerCase();

  // Quick questions with abstract-grounded answers
  if (ql.includes("explica") || ql.includes("simples") || ql.includes("resumo")) {
    return `Com base no resumo disponível: Este é um ${article.study_type || "estudo"} de ${article.year}, publicado em ${article.journal}. ${abstract}`;
  }
  if (ql.includes("limitaç") || ql.includes("limitação") || ql.includes("limite")) {
    const parts: string[] = [];
    if (article.evidence_reason) parts.push(`Avaliação de evidência: ${article.evidence_reason}`);
    if (article.potential_bias && article.potential_bias !== "Nenhum identificado") parts.push(`Viés identificado: ${article.potential_bias}`);
    if (parts.length === 0) parts.push("O resumo disponível não detalha limitações específicas. Consulte o artigo completo via DOI para a seção de limitações.");
    return parts.join(" ");
  }
  if (ql.includes("confiável") || ql.includes("citar") || ql.includes("fonte")) {
    return `Avaliação para citação: Score de evidência ${article.evidence_score}/5 (${EVIDENCE_LABELS[article.evidence_score] || "N/A"}). ${article.expert_reviewed ? "✓ Avaliado por pares." : "⚠️ Não avaliado por pares — use com cautela."} ${article.citations > 0 ? `${article.citations.toLocaleString()} citações.` : ""} Publicado em ${article.journal} (${article.year}). ⚠️ Sempre confirme pelo DOI antes de citar.`;
  }
  if (ql.includes("verificar") || ql.includes("checar") || ql.includes("conferir")) {
    return `Para verificar: 1) Acesse doi.org/${article.doi || "[consulte o DOI]"} e confirme que título e autores batem. 2) Leia o abstract original em inglês. 3) Confira o periódico "${article.journal}" no Qualis CAPES. 4) Compare a referência ABNT gerada com os dados do artigo original.`;
  }

  // Free-form: try to answer from abstract
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const relevant = words.some(w => abstract.toLowerCase().includes(w));
  
  if (relevant) {
    return `Com base no resumo disponível deste artigo: ${abstract}\n\n⚠️ Esta resposta é baseada exclusivamente no resumo. Para informações mais detalhadas, consulte o artigo completo via DOI.`;
  }

  return `⚠️ Esta informação específica não consta no resumo disponível deste artigo. O resumo aborda: "${abstract.substring(0, 150)}..." Para obter essa informação, acesse o artigo completo em doi.org/${article.doi || "[DOI]"}.`;
};

/* ── Score dots ── */
const ScoreDots = ({ score }: { score: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className={`w-2.5 h-2.5 rounded-full ${
          i <= score ? "bg-primary" : "bg-foreground/10"
        }`}
      />
    ))}
    <span className="text-xs font-bold text-foreground/70 ml-1.5">
      {score}/5 · {EVIDENCE_LABELS[score] || "N/A"}
    </span>
  </div>
);

/* ── Article Card with Chat ── */
const ArticleCard = ({ article, onSave, saved }: { article: Article; onSave: () => void; saved: boolean }) => {
  const [copiedAbnt, setCopiedAbnt] = useState(false);
  const [showAbnt, setShowAbnt] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [msgs, setMsgs] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const studyInfo = STUDY_TYPE_MAP[article.study_type] || { icon: "📄", label: article.study_type };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const copyAbnt = () => {
    navigator.clipboard?.writeText(article.abnt);
    setCopiedAbnt(true);
    setTimeout(() => setCopiedAbnt(false), 2000);
  };

  const sendMessage = async (q?: string) => {
    const m = (q || chatInput).trim();
    if (!m) return;
    setChatInput("");
    setMsgs((prev) => [...prev, { role: "user", text: m }]);
    setChatLoading(true);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
    setMsgs((prev) => [...prev, { role: "ai", text: getContextualAnswer(m, article) }]);
    setChatLoading(false);
  };

  return (
    <div className="bg-card/40 border border-foreground/5 rounded-2xl p-5 hover:border-primary/20 transition-all">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{article.year}</span>
          <span>{article.journal}</span>
          <span style={{ color: SC_BADGES.find(s => s.name === article.source)?.color }}>
            via {article.source}
          </span>
          {article.is_oa && (
            <span className="text-primary text-[10px] font-bold">🔓 Acesso aberto</span>
          )}
        </div>
        <button
          onClick={onSave}
          className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors ${
            saved
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-foreground/10 text-muted-foreground hover:border-primary/20"
          }`}
        >
          {saved ? "✓ Salvo" : "Salvar"}
        </button>
      </div>

      {/* Title */}
      <h4 className="font-bold text-foreground leading-tight mb-1">{article.title}</h4>
      <p className="text-xs text-muted-foreground mb-3">
        {article.authors} · {article.citations > 0 ? `${article.citations.toLocaleString()} citações` : ""}
      </p>

      {/* Score */}
      <div className="mb-3">
        <ScoreDots score={article.evidence_score} />
      </div>

      {/* Why this score */}
      {article.evidence_reason && (
        <div className="mb-3 p-3 rounded-xl bg-foreground/[0.03] border border-foreground/5 text-xs text-foreground/60">
          <span className="font-semibold text-foreground/80">Por que {EVIDENCE_LABELS[article.evidence_score]}?</span>{" "}
          {article.evidence_reason}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {article.expert_reviewed && (
          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-semibold">
            ✓ Avaliado por especialistas
          </span>
        )}
        <span className="bg-foreground/5 text-foreground/60 border border-foreground/10 px-2 py-0.5 rounded text-[10px] font-semibold">
          {studyInfo.icon} {studyInfo.label}
        </span>
        {article.citations > 0 && (
          <span className="bg-foreground/5 text-foreground/60 border border-foreground/10 px-2 py-0.5 rounded text-[10px] font-semibold">
            📎 {article.citations.toLocaleString()} citações
          </span>
        )}
      </div>

      {/* Abstract */}
      <div className="mb-3">
        <div className="bg-background/60 p-4 rounded-xl text-sm text-foreground/80 italic border border-foreground/5 leading-relaxed">
          "{article.abstract_pt}"
        </div>
      </div>

      {/* Bias warning */}
      {article.potential_bias && article.potential_bias !== "Nenhum identificado" && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>Conflito ou viés: {article.potential_bias}</span>
        </div>
      )}

      {/* ABNT Reference */}
      <div className="mb-3">
        <button
          onClick={() => setShowAbnt(!showAbnt)}
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground transition-colors mb-1"
        >
          <FileText size={12} />
          Referência ABNT
          {showAbnt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showAbnt && (
          <div className="bg-foreground/[0.03] border border-foreground/5 rounded-xl p-3 text-xs text-foreground/70 font-mono leading-relaxed">
            {article.abnt}
            <button
              onClick={copyAbnt}
              className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              {copiedAbnt ? <Check size={10} /> : <Copy size={10} />}
              {copiedAbnt ? "Copiado!" : "Copiar ABNT"}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={`https://doi.org/${article.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <Link2 size={12} /> DOI
        </a>
        <a
          href={`https://doi.org/${article.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground/5 text-foreground/70 border border-foreground/10 hover:border-primary/20 transition-colors"
        >
          <ExternalLink size={12} /> Ver artigo
        </a>
        {article.is_oa && (
          <a
            href={`https://doi.org/${article.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            <Download size={12} /> PDF disponível
          </a>
        )}
        <button
          onClick={() => { setShowAbnt(true); copyAbnt(); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-foreground/5 text-foreground/70 border border-foreground/10 hover:border-primary/20 transition-colors"
        >
          {copiedAbnt ? <Check size={12} /> : <Copy size={12} />}
          {copiedAbnt ? "Copiado!" : "ABNT"}
        </button>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            showChat
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-foreground/5 text-foreground/70 border-foreground/10 hover:border-primary/20"
          }`}
        >
          <MessageCircle size={12} /> Perguntar à IA
        </button>
      </div>

      {/* Chat */}
      {showChat && (
        <div className="mt-4 bg-foreground/[0.02] rounded-2xl p-4 border border-foreground/5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageCircle size={14} className="text-primary" />
            <span className="font-semibold">Perguntar sobre este artigo</span>
            <span className="text-[10px] text-muted-foreground/50 ml-auto">contexto: resumo do artigo</span>
          </div>

          {msgs.length === 0 && (
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-foreground/10 bg-card/60 text-foreground/80 hover:bg-foreground/5 transition-colors"
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
                      ? "bg-primary/10 text-foreground ml-8"
                      : "bg-foreground/[0.03] text-foreground/80 mr-8 border border-foreground/5"
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
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pergunte algo sobre este artigo..."
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-foreground/10 bg-background/50 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.97] transition-all"
            >
              Enviar
            </button>
          </form>

          <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
            ⚠️ Respostas baseadas exclusivamente no resumo do artigo. Se a informação não constar no resumo, a IA indicará claramente.
          </p>
        </div>
      )}
    </div>
  );
};

/* ── Verification Guide ── */
const VerificationGuide = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card/40 border border-foreground/5 rounded-2xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-4 text-xs hover:bg-foreground/[0.02] transition-colors"
      >
        <Shield size={14} className="text-primary shrink-0" />
        <span className="font-bold text-foreground">Como verificar um artigo antes de citar</span>
        <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold ml-1">
          ⚠️ IA pode errar
        </span>
        <span className="ml-auto text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-1">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Resumos, referências e metadados são gerados por IA e podem conter imprecisões. 
            Siga os passos abaixo antes de usar qualquer artigo em um trabalho acadêmico.
          </p>
          {VERIFICATION_STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5">
              <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{s.n}</span>
              <div>
                <span className="font-semibold text-foreground text-xs">{s.icon} {s.title}</span>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Tab: Análises ── */
const AnalysisTab = ({ result, query }: { result: MockEntry; query: string }) => (
  <div className="space-y-6">
    <div className="bg-card/40 border border-foreground/5 rounded-2xl p-5">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 size={16} className="text-primary" /> Análise Metodológica
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-foreground/[0.03] rounded-xl p-4 border border-foreground/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total de estudos</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{result.count}</div>
        </div>
        <div className="bg-foreground/[0.03] rounded-xl p-4 border border-foreground/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avaliados por pares</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{result.articles.filter(a => a.expert_reviewed).length}/{result.articles.length}</div>
        </div>
        <div className="bg-foreground/[0.03] rounded-xl p-4 border border-foreground/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acesso aberto</span>
          <div className="text-2xl font-extrabold text-foreground mt-1">{result.articles.filter(a => a.is_oa).length}/{result.articles.length}</div>
        </div>
      </div>

      <h4 className="font-semibold text-foreground text-sm mb-3">Distribuição por tipo de estudo</h4>
      <div className="space-y-2">
        {Object.entries(
          result.articles.reduce((acc, a) => {
            acc[a.study_type] = (acc[a.study_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, count]) => {
          const info = STUDY_TYPE_MAP[type] || { icon: "📄", label: type };
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground/70 w-48">{info.icon} {info.label}</span>
              <div className="flex-1 bg-foreground/5 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(count / result.articles.length) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-foreground/50 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Source distribution */}
      <h4 className="font-semibold text-foreground text-sm mb-3 mt-6">Distribuição por fonte</h4>
      <div className="space-y-2">
        {Object.entries(
          result.articles.reduce((acc, a) => {
            acc[a.source] = (acc[a.source] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([source, count]) => {
          const badge = SC_BADGES.find(b => b.name === source);
          return (
            <div key={source} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground/70 w-48" style={{ color: badge?.color }}>{source}</span>
              <div className="flex-1 bg-foreground/5 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ backgroundColor: badge?.color || '#666' }} />
              </div>
              <span className="text-xs font-bold text-foreground/50 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>

    <div className="bg-card/40 border border-foreground/5 rounded-2xl p-5">
      <h4 className="font-semibold text-foreground text-sm mb-3">Pontos inconclusivos</h4>
      <p className="text-sm text-foreground/70 leading-relaxed mb-4">{result.synthesis.inconclusive_summary}</p>
      {result.synthesis.contradict_explanation && (
        <>
          <h4 className="font-semibold text-foreground text-sm mb-2">Por que alguns estudos contradizem?</h4>
          <p className="text-sm text-foreground/70 leading-relaxed">{result.synthesis.contradict_explanation}</p>
        </>
      )}
    </div>

    {/* Study Recortes */}
    {result.synthesis.study_recortes && result.synthesis.study_recortes.length > 0 && (
      <div className="bg-card/40 border border-foreground/5 rounded-2xl p-5">
        <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          🔍 Como os estudos se relacionam (Recortes)
        </h4>
        <div className="space-y-2">
          {result.synthesis.study_recortes.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-foreground/[0.02] border border-foreground/5">
              <span className="text-lg shrink-0">{["🔬", "📊", "📋", "🧬", "🌐"][i % 5]}</span>
              <p className="text-xs text-foreground/70 leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

/* ── Tab: Referências ── */
const ReferencesTab = ({ result }: { result: MockEntry }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyOne = (abnt: string, idx: number) => {
    navigator.clipboard?.writeText(abnt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAll = () => {
    const all = result.articles.map(a => a.abnt).join("\n\n");
    navigator.clipboard?.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <FileText size={16} className="text-primary" /> Referências ABNT
        </h3>
        <button
          onClick={copyAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          {copiedAll ? <Check size={12} /> : <Copy size={12} />}
          {copiedAll ? "Copiado tudo!" : "Copiar todas"}
        </button>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-300">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>Referências geradas por IA. Sempre confira com o artigo original antes de incluir no seu trabalho.</span>
      </div>
      {result.articles.map((art, i) => (
        <div key={i} className="bg-card/40 border border-foreground/5 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{art.year} · {art.journal} · {art.source}</p>
              <p className="text-sm font-mono text-foreground/80 leading-relaxed">{art.abnt}</p>
            </div>
            <button
              onClick={() => copyOne(art.abnt, i)}
              className="shrink-0 p-2 rounded-lg hover:bg-foreground/5 transition-colors"
            >
              {copiedIdx === i ? <Check size={14} className="text-primary" /> : <Copy size={14} className="text-muted-foreground" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Tab: Auditoria ── */
const AuditTab = ({ result }: { result: MockEntry }) => (
  <div className="space-y-4">
    <h3 className="font-bold text-foreground flex items-center gap-2">
      <ClipboardCheck size={16} className="text-primary" /> Auditoria de Fontes
    </h3>
    <p className="text-sm text-muted-foreground">Verificação automática da qualidade e confiabilidade das fontes encontradas.</p>
    {result.articles.map((art, i) => {
      const issues: string[] = [];
      if (art.potential_bias !== "Nenhum identificado") issues.push(art.potential_bias);
      if (art.evidence_score <= 2) issues.push("Nível de evidência baixo para sustentar conclusões fortes.");
      if (!art.expert_reviewed) issues.push("Artigo não avaliado por pares.");
      const status = issues.length === 0 ? "ok" : issues.length === 1 ? "warn" : "error";
      return (
        <div key={i} className={`bg-card/40 border rounded-2xl p-4 ${
          status === "ok" ? "border-emerald-500/20" : status === "warn" ? "border-amber-500/20" : "border-rose-500/20"
        }`}>
          <div className="flex items-start gap-3">
            {status === "ok" && <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
            {status === "warn" && <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />}
            {status === "error" && <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <h4 className="font-semibold text-foreground text-sm">{art.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{art.authors} · {art.year} · via {art.source}</p>
              {issues.length === 0 ? (
                <p className="text-xs text-emerald-400 mt-2">✓ Nenhum problema identificado. Fonte de alta qualidade.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {issues.map((issue, j) => (
                    <li key={j} className="text-xs text-amber-300">⚠ {issue}</li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span>Evidência: {art.evidence_score}/5</span>
                <span>Qualidade: {art.source_quality}</span>
                <span>{art.expert_reviewed ? "✓ Peer-reviewed" : "✗ Não revisado"}</span>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

/* ── Tab: Split PDF ── */
const SplitPdfTab = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="bg-primary/10 p-4 rounded-2xl mb-4">
      <FileSearch size={32} className="text-primary" />
    </div>
    <h3 className="font-bold text-foreground text-lg mb-2">Dissecar artigo em PDF</h3>
    <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
      Envie um PDF de artigo científico e a IA extrai automaticamente: objetivo, amostra, 
      resultado principal, p-valor, conflito de interesse e limitações — até as que os autores não declararam.
    </p>
    <div className="border-2 border-dashed border-foreground/10 rounded-2xl p-8 w-full max-w-md hover:border-primary/30 transition-colors cursor-pointer">
      <Download size={24} className="text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Arraste um PDF ou clique para selecionar</p>
      <p className="text-[10px] text-muted-foreground mt-1">Máximo 20MB · Apenas PDF</p>
    </div>
    <p className="text-xs text-muted-foreground mt-4">
      Funcionalidade disponível nos planos <span className="text-primary font-semibold">Estudante</span> e <span className="text-primary font-semibold">Pesquisador</span>
    </p>
  </div>
);

/* ── Async source loading indicator ── */
const SourceLoadingIndicator = ({ loadedSources }: { loadedSources: string[] }) => {
  const allSources = SOURCE_LIST;
  const pending = allSources.filter(s => !loadedSources.includes(s));
  
  if (pending.length === 0) return null;

  return (
    <div className="bg-card/40 border border-foreground/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
      <Loader2 size={16} className="text-primary animate-spin shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-foreground/70">
          Buscando em fontes adicionais...
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {pending.map(s => {
            const badge = SC_BADGES.find(b => b.name === s);
            return (
              <span
                key={s}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full border animate-pulse"
                style={{
                  backgroundColor: `${badge?.color || '#666'}10`,
                  color: `${badge?.color || '#666'}80`,
                  borderColor: `${badge?.color || '#666'}20`,
                }}
              >
                {s}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Main ResultsView ── */
const ResultsView = ({
  query,
  result,
  searchesLeft,
  onQueryChange,
  onSubmit,
  onSearch,
  onBack,
}: ResultsViewProps) => {
  const [activeTab, setActiveTab] = useState("search");
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("Todas");
  const [expertFilter, setExpertFilter] = useState(false);
  const [oaFilter, setOaFilter] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showConfidenceDetail, setShowConfidenceDetail] = useState(false);
  const [loadedSources, setLoadedSources] = useState<string[]>(["PubMed", "OpenAlex", "Semantic Scholar"]);

  // Simulate async source loading
  useEffect(() => {
    const batches = [
      { sources: ["CrossRef", "DOAJ", "SciELO"], delay: 800 },
      { sources: ["arXiv", "Europe PMC"], delay: 1600 },
      { sources: ["BASE", "Lens.org"], delay: 2400 },
      { sources: ["CORE"], delay: 3200 },
    ];
    const timers = batches.map(batch =>
      setTimeout(() => {
        setLoadedSources(prev => [...prev, ...batch.sources]);
      }, batch.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [result]);

  const toggleSave = (title: string) => {
    setSavedArticles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const filteredArticles = result.articles.filter((a) => {
    if (scoreFilter > 0 && a.evidence_score < scoreFilter) return false;
    if (sourceFilter !== "Todas" && a.source !== sourceFilter) return false;
    if (expertFilter && !a.expert_reviewed) return false;
    if (oaFilter && !a.is_oa) return false;
    return true;
  });

  const icmScore = (result.synthesis.confidence_score / 5 * 10).toFixed(1);
  const icmLabel = Number(icmScore) >= 8 ? "Muito forte" : Number(icmScore) >= 6 ? "Forte" : Number(icmScore) >= 4 ? "Moderado" : "Limitado";
  const maturityLabel = result.synthesis.maturity_label || (
    Number(icmScore) >= 8 ? "Consenso consolidado" : Number(icmScore) >= 6 ? "Evidência forte" : Number(icmScore) >= 4 ? "Debate ativo" : "Evidência emergente"
  );

  // Unique sources in results
  const resultSources = [...new Set(result.articles.map(a => a.source))];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-primary size-6" />
          <button onClick={onBack} className="flex items-center">
            <h1 className="text-xl font-extrabold tracking-tight">
              Scholar<span className="text-primary">IA</span>
            </h1>
          </button>
          <span className="bg-foreground/10 text-xs font-bold px-2 py-0.5 rounded text-primary">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="border border-foreground/20 text-primary px-4 py-1.5 rounded-lg text-sm font-semibold">
            {searchesLeft} buscas restantes
          </div>
          <button
            onClick={() => setShowPlans(true)}
            className="border border-foreground/20 px-4 py-1.5 rounded-lg text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
          >
            Planos
          </button>
        </div>
      </header>

      <PlansModal open={showPlans} onClose={() => setShowPlans(false)} />

      <main className="max-w-4xl mx-auto px-5 py-6">
        {/* TIPS BAR */}
        <div className="bg-card/60 border border-foreground/5 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-primary font-bold flex items-center gap-1.5 mb-1">
              💡 COMO OBTER MELHORES RESULTADOS
            </span>
            <span className="text-muted-foreground">
              Perguntas específicas com causa e efeito trazem muito mais artigos relevantes.
            </span>
          </div>
          <div>
            <span className="text-rose-400 font-bold flex items-center gap-1.5 mb-1">
              ✗ EVITE
            </span>
            <span className="text-muted-foreground">
              benefícios do açafrão<br />chá é saudável?
            </span>
          </div>
          <div>
            <span className="text-primary font-bold flex items-center gap-1.5 mb-1">
              ✓ PREFIRA
            </span>
            <span className="text-muted-foreground">
              açafrão reduz depressão em adultos?<br />sono fragmentado causa Alzheimer?
            </span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={onSubmit} className="w-full bg-card/60 border border-foreground/10 rounded-2xl p-4 mb-4 shadow-lg">
          <div className="relative mb-3">
            <BrainCircuit className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full py-3 pl-12 pr-10 rounded-xl bg-background/50 border border-foreground/10 text-base placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-base hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Buscar e analisar artigos <ArrowRight size={18} />
          </button>
        </form>

        {/* TABS */}
        <div className="flex items-center gap-1 bg-card/40 border border-foreground/5 rounded-2xl p-1.5 mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-foreground/10"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === "analysis" && <AnalysisTab result={result} query={query} />}
        {activeTab === "references" && <ReferencesTab result={result} />}
        {activeTab === "audit" && <AuditTab result={result} />}
        {activeTab === "split" && <SplitPdfTab />}

        {activeTab === "search" && (
          <>
            {/* ASYNC SOURCE LOADING */}
            <SourceLoadingIndicator loadedSources={loadedSources} />

            {/* CONSENSUS PANEL */}
            <div className="bg-gradient-to-br from-[hsl(160,82%,11%)] to-[hsl(160,60%,16%)] rounded-3xl p-6 md:p-8 border border-foreground/5 shadow-2xl mb-6">
              <div className="mb-1 flex items-center gap-3">
                <span className="text-primary/80 text-[10px] font-bold uppercase tracking-widest">
                  INTERPRETAÇÃO COM BASE EM {result.count} ESTUDOS CIENTÍFICOS
                </span>
                {result.synthesis.maturity_label && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    result.synthesis.maturity_label.includes("Consenso") 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : result.synthesis.maturity_label.includes("Debate")
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  }`}>
                    {result.synthesis.maturity_label}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                "{query}"
              </h3>

              {/* Source badges - show actual sources used */}
              <div className="flex gap-1.5 mb-5 flex-wrap">
                {resultSources.map((name) => {
                  const badge = SC_BADGES.find((b) => b.name === name);
                  return (
                    <span
                      key={name}
                      style={{ backgroundColor: `${badge?.color}20`, color: badge?.color, borderColor: `${badge?.color}30` }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>

              {/* Direct answer */}
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 mb-6">
                <p className="text-sm text-white/90 leading-relaxed">
                  {result.synthesis.direct_answer}
                </p>
              </div>

              {/* Study recortes in consensus */}
              {result.synthesis.study_recortes && result.synthesis.study_recortes.length > 0 && (
                <div className="mb-6 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    🔍 RECORTES DOS ESTUDOS
                  </span>
                  {result.synthesis.study_recortes.map((r, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-white/70 leading-relaxed">
                      {r}
                    </div>
                  ))}
                </div>
              )}

              {/* Horizontal consensus bars */}
              <div className="space-y-2.5 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-white/70 w-36 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" /> Estudos concordam
                  </span>
                  <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${result.synthesis.consensus_agree}%` }} />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 w-10 text-right">
                    {result.synthesis.consensus_agree}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-white/70 w-36 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-400" /> Inconclusivo
                  </span>
                  <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${result.synthesis.consensus_inconclusive}%` }} />
                  </div>
                  <span className="text-xs font-bold text-amber-400 w-10 text-right">
                    {result.synthesis.consensus_inconclusive}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-white/70 w-36 flex items-center gap-1.5">
                    <XCircle size={13} className="text-rose-400" /> Contradizem
                  </span>
                  <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-400" style={{ width: `${result.synthesis.consensus_contradict}%` }} />
                  </div>
                  <span className="text-xs font-bold text-rose-400 w-10 text-right">
                    {result.synthesis.consensus_contradict}%
                  </span>
                </div>
              </div>

              {/* ICM Score */}
              <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-2xl font-black text-white">{icmScore}</span>
                    <span className="text-xs text-white/50 ml-1">/10</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                      ÍNDICE DE CONFIANÇA METODOLÓGICA (ICM)
                    </span>
                    <p className="text-xs text-white/50">
                      <span className="font-bold text-white/80">{icmLabel}</span> — baseado no tipo e citações dos estudos · <span className="font-semibold text-primary/80">{maturityLabel}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence + Insight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 block">
                    NÍVEL DE CONFIANÇA
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-white capitalize">
                      {result.synthesis.confidence_level}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-sm ${
                            i <= result.synthesis.confidence_score
                              ? "bg-primary"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfidenceDetail(!showConfidenceDetail)}
                    className="text-[10px] text-primary/80 hover:text-primary underline mb-2 transition-colors"
                  >
                    {showConfidenceDetail ? "Ocultar explicação" : "Por que é " + result.synthesis.confidence_level + "?"}
                  </button>
                  {showConfidenceDetail && (
                    <p className="text-[11px] text-white/60 leading-relaxed mb-2 p-2 bg-white/5 rounded-lg">
                      {CONFIDENCE_EXPLANATIONS[result.synthesis.confidence_level] || ""}
                    </p>
                  )}
                  {result.synthesis.confidence_reasons?.map((r, i) => (
                    <p key={i} className="text-[11px] text-white/50 leading-relaxed">
                      · {r}
                    </p>
                  ))}
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1.5">
                    💡 INSIGHT PRÁTICO
                  </span>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {result.synthesis.practical_insight}
                  </p>
                  {result.synthesis.search_tip && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-1.5 mb-1">
                        <Zap size={10} /> DICA DE BUSCA
                      </span>
                      <p className="text-[11px] text-white/60">{result.synthesis.search_tip}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI WARNING */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-6">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Resumos e metadados são gerados por IA e podem conter imprecisões. Verifique o artigo original antes de citar.
              </span>
            </div>

            {/* VERIFICATION GUIDE */}
            <VerificationGuide />

            {/* FILTERS */}
            <div className="flex items-center gap-3 flex-wrap mb-3 text-xs">
              <span className="text-muted-foreground font-semibold">
                {filteredArticles.length} artigos
              </span>
              <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded accent-primary" checked={expertFilter} onChange={(e) => setExpertFilter(e.target.checked)} /> Avaliados por especialistas
              </label>
              <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded accent-primary" checked={oaFilter} onChange={(e) => setOaFilter(e.target.checked)} /> Acesso aberto
              </label>
              <span className="text-muted-foreground">Nota mín.</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setScoreFilter(scoreFilter === n ? 0 : n)}
                    className={`w-7 h-7 rounded text-[11px] font-bold border transition-colors ${
                      scoreFilter === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-foreground/10 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Source filter badges */}
            <div className="flex items-center gap-1.5 flex-wrap mb-6">
              <button
                onClick={() => setSourceFilter("Todas")}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  sourceFilter === "Todas"
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground/10 text-muted-foreground"
                }`}
              >
                Todas
              </button>
              {SC_BADGES.map((sc) => (
                <button
                  key={sc.name}
                  onClick={() => setSourceFilter(sourceFilter === sc.name ? "Todas" : sc.name)}
                  style={{
                    backgroundColor: sourceFilter === sc.name ? `${sc.color}20` : undefined,
                    color: sourceFilter === sc.name ? sc.color : undefined,
                    borderColor: sourceFilter === sc.name ? `${sc.color}30` : undefined,
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    sourceFilter === sc.name ? "" : "border-foreground/10 text-muted-foreground"
                  }`}
                >
                  {sc.name}
                </button>
              ))}
            </div>

            {/* ARTICLES */}
            <div className="space-y-4">
              {filteredArticles.map((art, i) => (
                <ArticleCard
                  key={i}
                  article={art}
                  saved={savedArticles.includes(art.title)}
                  onSave={() => toggleSave(art.title)}
                />
              ))}
            </div>

            {/* LOAD MORE */}
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                onClick={() => onSearch(query)}
                className="bg-card/60 border border-foreground/10 hover:border-primary/30 px-8 py-3 rounded-2xl text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Search size={16} /> Buscar mais artigos sobre este tema
              </button>
              <p className="text-[10px] text-muted-foreground">
                {searchesLeft} buscas restantes · <button onClick={() => setShowPlans(true)} className="text-primary hover:underline">Upgrade para mais</button>
              </p>
            </div>
          </>
        )}
      </main>

      {/* Floating Bot */}
      <button className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-2xl hover:brightness-110 active:scale-[0.95] transition-all z-50">
        <Bot size={24} />
      </button>
    </div>
  );
};

export default ResultsView;

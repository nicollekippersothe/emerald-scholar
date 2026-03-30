import { Link } from "react-router-dom";
import { BrainCircuit, ArrowLeft, ExternalLink, ShieldCheck, Globe, BookOpen, FlaskConical, Microscope, ScrollText, Database, Cpu, Building2, Search, FileText } from "lucide-react";

const SOURCES = [
  {
    name: "PubMed / MEDLINE",
    color: "#EF4444",
    icon: Microscope,
    type: "Base biomédica oficial",
    agency: "National Library of Medicine (NIH) · EUA",
    coverage: "Mais de 35 milhões de citações em ciências da saúde, biologia, bioquímica e farmacologia.",
    peerReview: true,
    openAccess: "Parcial (PMC para artigos em acesso aberto)",
    strengths: ["Padrão ouro em medicina e biomedicina", "Indexação rigorosa com MeSH terms", "Todos os artigos são revisados por pares", "Integração com PubMed Central (texto completo)"],
    limitations: ["Foco predominante em inglês", "Artigos muito recentes podem não estar indexados", "Não cobre engenharia ou ciências exatas"],
    url: "https://pubmed.ncbi.nlm.nih.gov",
  },
  {
    name: "OpenAlex",
    color: "#3B82F6",
    icon: Globe,
    type: "Grafo aberto de conhecimento acadêmico",
    agency: "OurResearch · Open Source",
    coverage: "Mais de 250 milhões de obras acadêmicas em todas as disciplinas, com dados de citações e coautorias.",
    peerReview: true,
    openAccess: "Alta (API gratuita e aberta)",
    strengths: ["Cobertura multidisciplinar massiva", "API aberta e gratuita sem limitação de taxa", "Dados de citações e colaborações", "Sucessor do Microsoft Academic Graph"],
    limitations: ["Qualidade de metadados varia entre áreas", "Não distingue qualidade editorial internamente"],
    url: "https://openalex.org",
  },
  {
    name: "Semantic Scholar",
    color: "#A78BFA",
    icon: Cpu,
    type: "Base acadêmica com IA",
    agency: "Allen Institute for AI (AI2) · EUA",
    coverage: "Mais de 200 milhões de artigos com análise semântica por IA, identificando influência e citações contextuais.",
    peerReview: true,
    openAccess: "Sim (API gratuita)",
    strengths: ["Extração de influência de citações por contexto (altamente citado x marginalmente citado)", "TLDRs gerados por IA", "Detecção de artigos com impacto real vs. nominal", "Cobertura de CS e IA especialmente forte"],
    limitations: ["IA pode errar na extração semântica", "Cobertura de ciências sociais e humanidades é menor"],
    url: "https://www.semanticscholar.org",
  },
  {
    name: "CrossRef",
    color: "#2DD4BF",
    icon: FileText,
    type: "Registro oficial de DOIs acadêmicos",
    agency: "CrossRef (consórcio editorial) · Internacional",
    coverage: "Mais de 145 milhões de registros de DOI de periódicos, livros, conjuntos de dados e relatórios.",
    peerReview: true,
    openAccess: "Metadados abertos (texto via DOI)",
    strengths: ["Fonte autoritativa de metadados bibliográficos", "Verifica autenticidade de DOIs", "Cobre praticamente todos os periódicos indexados", "Dados de financiamento e filiação institucional"],
    limitations: ["Não fornece texto completo diretamente", "Sem análise de qualidade ou relevância"],
    url: "https://www.crossref.org",
  },
  {
    name: "DOAJ",
    color: "#38BDF8",
    icon: BookOpen,
    type: "Diretório de periódicos de acesso aberto",
    agency: "DOAJ (infraestrutura sem fins lucrativos) · Internacional",
    coverage: "Mais de 19.000 periódicos de acesso aberto revisados por pares, com critérios editoriais verificados.",
    peerReview: true,
    openAccess: "100% (requisito de inclusão)",
    strengths: ["Todos os periódicos passam por curadoria editorial", "Combate periódicos predatórios", "Texto completo gratuito para todos os artigos", "Inclui periódicos de países em desenvolvimento"],
    limitations: ["Menor volume que PubMed ou OpenAlex", "Foco em periódicos OA pode excluir trabalhos importantes em revistas pagas"],
    url: "https://doaj.org",
  },
  {
    name: "SciELO",
    color: "#22C55E",
    icon: Building2,
    type: "Biblioteca científica eletrônica ibero-americana",
    agency: "FAPESP + BIREME/OPAS/OMS · Brasil e América Latina",
    coverage: "Mais de 1.600 periódicos científicos ibero-americanos e sul-africanos, com destaque para saúde, ciências sociais e agricultura.",
    peerReview: true,
    openAccess: "Sim (texto completo gratuito)",
    strengths: ["Única base com cobertura profunda da ciência brasileira e latino-americana", "Texto completo em português disponível", "Alta relevância para políticas de saúde pública regionais", "Classificação Qualis CAPES integrada"],
    limitations: ["Foco regional pode limitar comparações globais", "Volume menor que bases internacionais"],
    url: "https://scielo.org",
  },
  {
    name: "arXiv",
    color: "#F97316",
    icon: FlaskConical,
    type: "Servidor de preprints",
    agency: "Cornell University · EUA",
    coverage: "Mais de 2 milhões de preprints em física, matemática, ciência da computação, biologia quantitativa, estatística e finanças.",
    peerReview: false,
    openAccess: "Sim (todos os artigos)",
    strengths: ["Acesso imediato a pesquisa de ponta antes da revisão por pares", "Essencial em IA, ML e física de partículas", "Histórico completo de versões disponível", "Alta velocidade de disseminação científica"],
    limitations: ["Artigos NÃO foram revisados por pares", "Resultados preliminares podem mudar na publicação final", "Não adequado como fonte única em trabalhos acadêmicos clínicos"],
    url: "https://arxiv.org",
  },
  {
    name: "Europe PMC",
    color: "#E11D48",
    icon: ScrollText,
    type: "Repositório biomédico europeu",
    agency: "EMBL-EBI + The Wellcome Trust · Europa",
    coverage: "Mais de 43 milhões de artigos em ciências da vida e medicina, com textos completos de artigos financiados pelo MRC, Wellcome Trust e outros.",
    peerReview: true,
    openAccess: "Alta (mandato de acesso aberto dos financiadores europeus)",
    strengths: ["Texto completo minerável (text mining APIs)", "Cobertura de artigos financiados pelo Horizon Europe", "Dados de ensaios clínicos integrados", "Inclui literatura cinza biomédica"],
    limitations: ["Foco em ciências da vida — cobertura limitada em outras áreas"],
    url: "https://europepmc.org",
  },
  {
    name: "BASE",
    color: "#8B5CF6",
    icon: Database,
    type: "Mecanismo de busca de repositórios institucionais",
    agency: "Universidade de Bielefeld · Alemanha",
    coverage: "Mais de 350 milhões de documentos de mais de 10.000 repositórios institucionais, teses, dissertações e relatórios técnicos.",
    peerReview: false,
    openAccess: "Alta (foco em acesso aberto)",
    strengths: ["Única base com cobertura massiva de teses e dissertações", "Acesso a literatura cinza (relatórios técnicos, dados de pesquisa)", "Cobre repositórios de universidades de todo o mundo", "Inclui produção acadêmica que não chega a periódicos"],
    limitations: ["Qualidade varia muito entre repositórios", "Inclui documentos sem revisão por pares", "Metadados inconsistentes entre fontes"],
    url: "https://www.base-search.net",
  },
  {
    name: "Lens.org",
    color: "#06B6D4",
    icon: Search,
    type: "Grafo de conhecimento: literatura + patentes",
    agency: "Cambia (organização sem fins lucrativos) · Austrália",
    coverage: "Mais de 220 milhões de documentos acadêmicos e 120 milhões de patentes, com cruzamento único entre literatura científica e propriedade intelectual.",
    peerReview: true,
    openAccess: "Sim (API gratuita)",
    strengths: ["Único recurso que cruza patentes com literatura acadêmica", "Identifica transferência de tecnologia da academia para o mercado", "Útil para detectar conflitos de interesse industriais", "Análise de impacto de pesquisa em inovação"],
    limitations: ["Interface mais complexa para uso acadêmico puro", "Patentes requerem conhecimento jurídico para interpretação"],
    url: "https://www.lens.org",
  },
  {
    name: "CORE",
    color: "#D97706",
    icon: ShieldCheck,
    type: "Agregador de acesso aberto com texto completo",
    agency: "The Open University + Jisc · Reino Unido",
    coverage: "Mais de 270 milhões de artigos em acesso aberto com texto completo indexável, coletados de repositórios e periódicos OA.",
    peerReview: false,
    openAccess: "Sim (texto completo obrigatório para indexação)",
    strengths: ["Texto completo disponível para análise profunda", "Inclui preprints, relatórios e literatura cinza", "API de mineração de texto completa", "Maior agregador de acesso aberto do mundo"],
    limitations: ["Inclui preprints sem revisão por pares", "Qualidade dos metadados depende dos repositórios de origem"],
    url: "https://core.ac.uk",
  },
  {
    name: "Cochrane Library",
    color: "#0EA5E9",
    icon: Microscope,
    type: "Revisões sistemáticas de padrão ouro",
    agency: "Cochrane Collaboration · Internacional",
    coverage: "Mais de 8.000 revisões sistemáticas Cochrane em saúde e medicina clínica, consideradas o mais alto nível de evidência disponível.",
    peerReview: true,
    openAccess: "Parcial (resumos gratuitos; texto completo por assinatura ou via SUS/CAPES)",
    strengths: ["Padrão ouro em medicina baseada em evidências", "Revisões sistemáticas com meta-análises rigorosas", "Protocolo GRADE para graduação de evidências", "Altamente citadas por diretrizes clínicas mundiais"],
    limitations: ["Foco exclusivo em saúde e medicina clínica", "Atualização pode ser lenta em áreas de rápida evolução", "Texto completo requer acesso institucional"],
    url: "https://www.cochranelibrary.com",
  },
  {
    name: "BVS / LILACS",
    color: "#10B981",
    icon: Building2,
    type: "Biblioteca Virtual em Saúde da América Latina",
    agency: "BIREME/OPAS/OMS · Brasil e América Latina",
    coverage: "Mais de 900.000 artigos em saúde da América Latina e Caribe, incluindo literatura técnica, dissertações e relatórios em português e espanhol.",
    peerReview: true,
    openAccess: "Sim (texto completo gratuito para a maioria)",
    strengths: ["Maior e mais abrangente base de literatura científica e técnica da AL", "Cobertura em português e espanhol com texto completo", "Inclui teses, dissertações e relatórios técnicos regionais", "Essencial para pesquisa em saúde pública brasileira"],
    limitations: ["Foco regional em saúde — não cobre outras áreas do conhecimento", "Metadados podem estar incompletos em publicações mais antigas"],
    url: "https://bvsalud.org",
  },
];

const Sources = () => {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-foreground/10 sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-primary size-6" />
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-extrabold tracking-tight">
              Scholar<span className="text-primary">IA</span>
            </h1>
          </Link>
          <span className="bg-foreground/10 text-xs font-bold px-2 py-0.5 rounded text-primary">
            BETA
          </span>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} /> Voltar à pesquisa
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-primary/20">
            <Database size={14} /> 13 BASES SIMULTÂNEAS
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Nossas Fontes Científicas
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Cada busca no ScholarIA consulta simultaneamente 13 bases de dados acadêmicas selecionadas pelo rigor
            científico, cobertura geográfica e diversidade de acesso. Entenda o que cada fonte oferece, suas forças e limitações.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-foreground/[0.03] border border-foreground/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Revisado por pares
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Pode incluir preprints (não revisados)
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={12} className="text-primary" /> Acesso aberto total
          </div>
        </div>

        {/* Source cards */}
        <div className="space-y-6">
          {SOURCES.map((source) => {
            const Icon = source.icon;
            return (
              <div
                key={source.name}
                className="bg-card/40 border border-foreground/5 rounded-2xl overflow-hidden hover:border-foreground/10 transition-colors"
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between p-5 border-b border-foreground/5"
                  style={{ borderLeftColor: source.color, borderLeftWidth: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: `${source.color}18` }}
                    >
                      <Icon size={20} style={{ color: source.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-foreground text-base">{source.name}</h3>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            color: source.color,
                            backgroundColor: `${source.color}15`,
                            borderColor: `${source.color}30`,
                          }}
                        >
                          {source.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{source.agency}</p>
                    </div>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 rounded-lg hover:bg-foreground/5 transition-colors"
                    aria-label={`Acessar ${source.name}`}
                  >
                    <ExternalLink size={14} className="text-muted-foreground" />
                  </a>
                </div>

                {/* Card body */}
                <div className="p-5 grid md:grid-cols-2 gap-5">
                  {/* Left column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Cobertura</p>
                      <p className="text-sm text-foreground/75 leading-relaxed">{source.coverage}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${source.peerReview ? "bg-emerald-400" : "bg-amber-400"}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {source.peerReview ? "Revisado por pares" : "Inclui preprints"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={11} className="text-primary" />
                        <span className="text-xs text-muted-foreground">{source.openAccess}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1.5">Pontos fortes</p>
                      <ul className="space-y-1">
                        {source.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                            <span className="text-emerald-500 shrink-0">·</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1.5">Limitações</p>
                      <ul className="space-y-1">
                        {source.limitations.map((l, i) => (
                          <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                            <span className="text-amber-500 shrink-0">·</span> {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            O Emerald Scholar utiliza dados demonstrativos nesta versão BETA. Em produção, os resultados virão diretamente das APIs das bases listadas acima.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline font-semibold"
          >
            <ArrowLeft size={14} /> Voltar e fazer uma busca
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Sources;

# ScholarIA — Instruções para o Claude Code

## Stack
React + Vite + TypeScript + Tailwind + shadcn/ui. App de pesquisa acadêmica em português (BR) com mock data simulando 13 bases científicas.

---

## Regras para adicionar entradas ao mockDatabase.ts

Ao criar ou editar qualquer `MockEntry` em `src/data/mockDatabase.ts`, siga **obrigatoriamente** estas regras:

### 1. `count` deve refletir o array real
`count` deve ser **igual** ao número de objetos dentro de `articles`. Nunca invente um count maior.

### 2. Cobertura das 13 bases
Cada entry deve ter artigos de pelo menos **10 das 13 bases**, priorizando cobertura ampla. As 13 bases são:
`PubMed`, `OpenAlex`, `Semantic Scholar`, `CrossRef`, `DOAJ`, `SciELO`, `arXiv`, `Europe PMC`, `BASE`, `Lens.org`, `CORE`, `Cochrane`, `BVS/LILACS`

Distribuição mínima recomendada por tipo:
- ≥ 1 revisão sistemática ou meta-análise (PubMed, OpenAlex, Cochrane ou Semantic Scholar)
- ≥ 1 ECR ou coorte prospectiva
- ≥ 1 artigo de acesso aberto (DOAJ, CORE)
- ≥ 1 perspectiva brasileira ou latino-americana (SciELO ou BVS/LILACS)
- ≥ 1 tese/dissertação ou preprint (BASE ou arXiv) — com `expert_reviewed: false` e `source_quality: "média"`

### 3. `confidence_reasons` — qualidade metodológica, não achados
Os itens de `confidence_reasons` devem explicar **por que o score de confiança é alto ou baixo**, com base na qualidade da evidência. Nunca copie fatos dos estudos aqui.

✗ ERRADO (fato do estudo):
```
"62% das resistências antimicrobianas têm origem animal"
"A vigilância detecta surtos 18 dias antes"
```

✓ CERTO (qualidade metodológica):
```
"5 revisões sistemáticas em periódicos de alto impacto (Lancet, Nature Medicine)"
"1 preprint sem revisão por pares reduz levemente o score"
"Campo com debate ativo — conclusões divergentes refletem complexidade, não fragilidade"
```

### 4. `direct_answer` menciona o count real
Formato: `"Com base em X estudos analisados — [contexto]..."`

### 5. Consenso vs. resumo temático
- Buscas **com `?`** (pergunta direta): preencher `consensus_agree`, `consensus_inconclusive`, `consensus_contradict` com valores que somem 100.
- Buscas **sem `?`** (tema amplo): usar `consensus_agree: 0, consensus_inconclusive: 100, consensus_contradict: 0` — a UI omite as barras de concordância automaticamente neste modo.

### 6. Artigos realistas
- `abstract_pt`: parágrafo em português descrevendo o estudo com dados numéricos verossímeis (n amostral, p-valor, HR, etc.)
- `evidence_reason`: frase curta explicando o que torna este artigo mais ou menos confiável (design, limitações)
- `potential_bias`: limitação real do estudo (ex: "Amostra pequena; financiado pelo fabricante")
- `confidence_score`: entre 40–95. Revisões Cochrane ficam em 85–95; preprints sem revisão, 40–55.

---

## Lógica de exibição (UI)

- **Modo consenso** (query com `?`): exibe % Concordam, aba Distribuição com barras, badge "Análise de Consenso"
- **Modo resumo** (query sem `?`): exibe apenas ICM e Confiança, sem barras de concordância, badge "Resumo Interpretativo"
- **Paginação**: exibe 5 artigos por padrão, botão "Carregar mais" aparece quando `articles.length > 5`

## Componentes principais
- `src/pages/Index.tsx` — landing page
- `src/components/ResultsView.tsx` — tela de resultados completa
- `src/hooks/useQueryIntention.ts` — detecta modo consenso vs. resumo (presença de `?`)
- `src/data/mockDatabase.ts` — toda a base de dados mock
- `src/lib/confidenceScore.ts` — cálculo do ICM (Índice de Confiança Metodológica)

/**
 * Hook to detect query intention based on presence of "?"
 * - With "?" → Consensus-focused mode
 * - Without "?" → Interpretive summary mode
 */

export interface QueryIntention {
  hasQuestion: boolean;
  mode: "consensus" | "summary";
  displayText: string;
  description: string;
}

export function useQueryIntention(query: string): QueryIntention {
  const trimmedQuery = query.trim();
  const hasQuestion = trimmedQuery.includes("?");

  if (hasQuestion) {
    return {
      hasQuestion: true,
      mode: "consensus",
      displayText: "Analisando consenso científico...",
      description: "Exibindo % de concordância, discordância e conclusões inconclusivas entre estudos",
    };
  }

  return {
    hasQuestion: false,
    mode: "summary",
    displayText: "Resumo interpretativo...",
    description: "Exibindo síntese dos estudos encontrados sobre este tema",
  };
}

export default useQueryIntention;

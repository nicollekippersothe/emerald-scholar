import { useState, useCallback } from "react";

const LS_KEY = "clara_recent_searches";
const MAX = 6;

function load(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>(load);

  const push = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setRecents((prev) => {
      const next = [q, ...prev.filter((r) => r !== q)].slice(0, MAX);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setRecents([]);
  }, []);

  return { recents, push, clear };
}

import { useState, FormEvent, useCallback } from "react";
import { BookOpen } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import ConsensusPanel from "@/components/ConsensusPanel";
import ArticleCard from "@/components/ArticleCard";
import VerificationGuide from "@/components/VerificationGuide";
import { findMatch, classifyQuery, type MockEntry, type Article } from "@/data/mockDatabase";

const Index = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<MockEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult(findMatch(query));
      setLoading(false);
    }, 800);
  };

  const toggleSave = useCallback((article: Article) => {
    setSavedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(article.title)) {
        next.delete(article.title);
      } else {
        next.add(article.title);
      }
      return next;
    });
  }, []);

  const queryType = query ? classifyQuery(query) : "broad";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 min-h-screen">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-black text-foreground mb-2">
          Scholar AI <span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground">
          A bússola científica para sua pesquisa acadêmica.
        </p>
      </header>

      <SearchBar query={query} onQueryChange={setQuery} onSubmit={handleSearch} />

      {loading && (
        <div className="text-center py-20 text-primary font-bold animate-pulse-soft">
          Consultando bases científicas...
        </div>
      )}

      {result && !loading && (
        <div className="animate-fade-up">
          <ConsensusPanel
            query={query}
            count={result.count}
            synthesis={result.synthesis}
            queryType={queryType}
          />

          <VerificationGuide />

          <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <BookOpen size={20} className="text-primary" /> Artigos em Destaque
          </h3>

          <div className="space-y-4 pb-16">
            {result.articles.map((art, i) => (
              <ArticleCard
                key={i}
                article={art}
                index={i}
                saved={savedArticles.has(art.title)}
                onSave={toggleSave}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

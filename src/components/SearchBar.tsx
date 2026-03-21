import { Search } from "lucide-react";
import { FormEvent } from "react";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: (e: FormEvent) => void;
}

const SearchBar = ({ query, onQueryChange, onSubmit }: SearchBarProps) => {
  return (
    <form onSubmit={onSubmit} className="relative mb-12">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Ex: O exercício ajuda na depressão?"
        className="w-full p-5 pl-14 pr-32 rounded-2xl border-none shadow-xl text-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-shadow duration-200"
      />
      <Search className="absolute left-5 top-5 text-muted-foreground" />
      <button
        type="submit"
        className="absolute right-3 top-3 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 active:scale-[0.97] transition-all duration-150"
      >
        Analisar
      </button>
    </form>
  );
};

export default SearchBar;

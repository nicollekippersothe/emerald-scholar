import type { Article } from "@/data/mockDatabase";

interface ArticleCardProps {
  article: Article;
  index: number;
}

const ArticleCard = ({ article, index }: ArticleCardProps) => {
  return (
    <div
      className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex justify-between mb-4">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold uppercase">
          {article.study_type}
        </span>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
          {article.source}
        </span>
      </div>
      <h4 className="font-bold text-foreground mb-2 leading-tight">
        {article.title}
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        {article.authors} • {article.year}
      </p>
      <div className="bg-muted p-4 rounded-xl text-sm text-muted-foreground italic">
        "{article.abstract_pt}"
      </div>
    </div>
  );
};

export default ArticleCard;

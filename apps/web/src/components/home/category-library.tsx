import Link from "next/link";
import { CoverSurface } from "@/components/cover-surface";
import { getCategoryCoverUrl } from "@/content/category-covers";
import type { TopicShelf } from "@/lib/view-models";

type CategoryLibraryProps = {
  topics: TopicShelf[];
};

export function CategoryLibrary({ topics }: CategoryLibraryProps) {
  return (
    <article id="categories" className="category-stage card dark">
      <div className="section-head">
        <h2>分类书架</h2>
        <span className="soft-link">按主题阅读</span>
      </div>

      <div className="category-grid">
        {topics.map((topic) => (
          <Link
            key={topic.name}
            href={topic.href}
            className="category-card category-card-link"
            aria-label={`进入 ${topic.name}`}
          >
            <CoverSurface
              alt={`${topic.name} 分类封面`}
              className="cover cover-small"
              coverUrl={getCategoryCoverUrl(topic.coverUrl)}
              sizes="(max-width: 1100px) 100vw, 28vw"
              tone={topic.tone}
            />
            <h3>{topic.name}</h3>
            <p>{topic.summary}</p>
            <div className="meta-line">{topic.articleCount}</div>
          </Link>
        ))}
      </div>
    </article>
  );
}

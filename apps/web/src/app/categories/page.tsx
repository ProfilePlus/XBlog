import Link from "next/link";
import { AuroraFrame } from "@/components/aurora-frame";
import { CoverSurface } from "@/components/cover-surface";
import { SiteHeader } from "@/components/site-header";
import { getCategoryCoverUrl } from "@/content/category-covers";
import { getCategoryOverviewCards } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoryOverviewCards();

  return (
    <AuroraFrame>
      <SiteHeader variant="secondary" />

      <div className="subpage-shell">
        <section className="secondary-hero">
          <div className="secondary-copy">
            <p className="eyebrow">Category Library</p>
            <h1>按分类进入 XBlog 的知识版图。</h1>
            <p className="lede">
              这里把技术写作、收录内容和后续方法论整理成清晰的四组主题，既方便阅读，也方便后面持续扩展。
            </p>
          </div>
          <article className="hero-side-note card glass">
            <span className="chip">浏览方式</span>
            <h2>先选主题，再进入文章与收录的具体脉络。</h2>
            <p>
              每个分类都保留自己的封面气质、代表文章和关注重点，让首页之后的阅读仍然保持清楚的分区逻辑。
            </p>
            <div className="hero-side-note-footer">
              <span className="stat-pill">{categories.length} 个主分类</span>
              <span className="stat-pill">原创与收录并行</span>
              <span className="stat-pill">持续扩展中</span>
            </div>
          </article>
        </section>

        <section className="catalog-grid">
          {categories.map((category) => {
            return (
              <Link
                key={category.id}
                className="catalog-card catalog-card-link card glass"
                href={`/categories/${category.slug}`}
                aria-label={`进入 ${category.name}`}
              >
                <CoverSurface
                  alt={`${category.name} 分类封面`}
                  className="catalog-cover cover cover-small"
                  coverUrl={getCategoryCoverUrl(category.coverUrl)}
                  sizes="(max-width: 1100px) 100vw, 40vw"
                  tone={category.tone}
                />
                <div className="catalog-head">
                  <div>
                    <p className="eyebrow">专题分区</p>
                    <h2>{category.name}</h2>
                  </div>
                  <span className="stat-pill">{category.articleCountLabel}</span>
                </div>
                <p className="catalog-summary">{category.summary}</p>
                <div className="tag-row">
                  {category.focusAreas.map((focus) => (
                    <span key={focus} className="tag-chip">
                      {focus}
                    </span>
                  ))}
                </div>
                {category.featuredTitle ? (
                  <div className="catalog-feature">
                    <span className="soft-link">代表文章</span>
                    <span>{category.featuredTitle}</span>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </section>
      </div>
    </AuroraFrame>
  );
}

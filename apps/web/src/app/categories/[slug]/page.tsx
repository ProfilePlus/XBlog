import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuroraFrame } from "@/components/aurora-frame";
import { CoverSurface } from "@/components/cover-surface";
import { SiteHeader } from "@/components/site-header";
import { getCategoryDetailPageData } from "@/lib/public-api";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getCategoryDetailPageData(slug);

  if (!payload) {
    return {
      title: "分类未找到 | XBlog",
    };
  }

  return {
    title: `${payload.category.name} | XBlog`,
    description: payload.category.longSummary,
  };
}

export default async function CategoryDetailPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;
  const payload = await getCategoryDetailPageData(slug);

  if (!payload) {
    notFound();
  }

  const { category, articles } = payload;

  return (
    <AuroraFrame>
      <SiteHeader variant="secondary" />

      <div className="subpage-shell">
        <section className="secondary-hero secondary-hero-split">
          <div className="secondary-copy">
            <p className="eyebrow">Category / {category.name}</p>
            <h1>{category.heroTitle}</h1>
            <p className="lede">{category.longSummary}</p>
            <div className="stat-row">
              <span className="stat-pill">{category.articleCountLabel}</span>
              <span className="stat-pill">{articles.length} 个已落地样例</span>
            </div>
          </div>

          <article className="hero-side-note card glass">
            <span className="chip">策展说明</span>
            <h2>{category.curatorNote}</h2>
            <div className="tag-row">
              {category.focusAreas.map((focus) => (
                <span key={focus} className="tag-chip">
                  {focus}
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className="content-split">
          <section className="story-grid">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="story-card story-card-link card glass"
              >
                <CoverSurface
                  alt={article.title}
                  className="story-cover cover cover-small"
                  coverUrl={article.coverUrl}
                  sizes="(max-width: 1100px) 100vw, 33vw"
                  tone={article.tone}
                />
                <div className="story-meta">
                  <span className="chip">{article.kindLabel}</span>
                  <h2>{article.title}</h2>
                  <p>{article.excerpt}</p>
                </div>
                <div className="story-footer">
                  <span>{article.publishedAt}</span>
                  <span>{article.readingTime}</span>
                </div>
              </Link>
            ))}
          </section>

          <aside className="support-column">
            <article className="support-card card dark">
              <div className="section-head">
                <h2>分类说明</h2>
                <span className="soft-link">稳定扩展入口</span>
              </div>
              <p>{category.curatorNote}</p>
            </article>

            <Link
              className="support-card support-card-link card glass"
              href={category.featuredArticleSlug ? `/articles/${category.featuredArticleSlug}` : "/categories"}
            >
              <div className="section-head">
                <h2>浏览建议</h2>
                <span className="soft-link">从最能代表这个分区的一篇开始</span>
              </div>
              <p>
                如果这是你第一次走进这个分区，不妨先从代表文章看起，再回到列表，把同一条线慢慢读开。
              </p>
            </Link>
          </aside>
        </section>
      </div>
    </AuroraFrame>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ArticleBlock } from "@xblog/contracts";
import { AuroraFrame } from "@/components/aurora-frame";
import { CoverSurface } from "@/components/cover-surface";
import { SiteHeader } from "@/components/site-header";
import { getArticlePageData } from "@/lib/public-api";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticlePageData(slug);

  if (!article) {
    return {
      title: "文章未找到 | XBlog",
    };
  }

  return {
    title: `${article.title} | XBlog`,
    description: article.excerpt,
  };
}

function renderBlock(block: ArticleBlock) {
  if (block.type === "paragraph") {
    return <p key={block.id}>{block.text}</p>;
  }

  if (block.type === "image") {
    return (
      <figure key={block.id} className="article-figure">
        <Image
          src={block.url}
          alt={block.alt}
          width={1200}
          height={720}
          className="article-image"
          unoptimized
        />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote key={block.id} className="article-quote">
        <p>{block.text}</p>
        {block.citation ? <cite>{block.citation}</cite> : null}
      </blockquote>
    );
  }

  if (block.type === "list") {
    const ListTag = block.style === "ordered" ? "ol" : "ul";
    return (
      <ListTag key={block.id} className="article-list">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "code") {
    return (
      <pre key={block.id} className="article-code">
        <code>{block.code}</code>
      </pre>
    );
  }

  if (block.type === "divider") {
    return <hr key={block.id} className="article-divider" />;
  }

  return null;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticlePageData(slug);

  if (!article) {
    notFound();
  }

  return (
    <AuroraFrame>
      <SiteHeader variant="secondary" />

      <div className="subpage-shell">
        <article className="article-hero card glass">
          <div className="article-hero-copy">
            <div className="breadcrumb-row">
              <Link href="/">首页</Link>
              <span>/</span>
              <Link href={`/categories/${article.category.slug}`}>{article.category.name}</Link>
            </div>
            <span className="chip">{article.kindLabel}</span>
            <h1>{article.title}</h1>
            <p className="lede">{article.lede}</p>
            <div className="meta-strip">
              <span>{article.publishedAt}</span>
              <span>{article.readingTime}</span>
              <span>{article.authorDisplayName}</span>
            </div>
          </div>

          <CoverSurface
            alt={article.title}
            className="article-cover cover"
            coverUrl={article.coverUrl}
            priority
            sizes="(max-width: 1100px) 100vw, 50vw"
            tone={article.tone}
          />
        </article>

        <section className="article-shell">
          <div className="article-main">
            {article.sections.map((section) => (
              <section key={section.id} className="body-section card dark">
                <h2>{section.heading}</h2>
                {section.blocks.map(renderBlock)}
              </section>
            ))}
          </div>

          <aside className="article-sidebar">
            <article className="support-card card glass">
              <div className="section-head">
                <h2>文章摘要</h2>
                <span className="soft-link">{article.authorRoleLabel}</span>
              </div>
              <ul className="insight-list">
                {article.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </article>

            <article className="support-card card dark">
              <div className="section-head">
                <h2>继续阅读</h2>
                <span className="soft-link">相关主题</span>
              </div>
              <div className="related-list">
                {article.related.map((entry) => (
                  <Link key={entry.slug} href={`/articles/${entry.slug}`} className="related-link">
                    <strong>{entry.title}</strong>
                    <p>{entry.excerpt}</p>
                  </Link>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </div>
    </AuroraFrame>
  );
}

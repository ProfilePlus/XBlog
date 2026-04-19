import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ArticleBlock } from "@xblog/contracts";
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
    return <p key={block.id} style={{ marginBottom: "20px", lineHeight: 1.8 }}>{block.text}</p>;
  }

  if (block.type === "image") {
    return (
      <figure key={block.id} style={{ margin: "32px 0", textAlign: "center" }}>
        <Image
          src={block.url}
          alt={block.alt}
          width={672}
          height={448}
          className="article-image-default"
          unoptimized
        />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote key={block.id} style={{ margin: "32px 0", padding: "20px", borderLeft: "4px solid var(--border-light)", fontStyle: "italic" }}>
        <p>{block.text}</p>
        {block.citation ? <cite style={{ display: "block", marginTop: "12px", fontSize: "0.875rem", color: "var(--text-light-muted)" }}>— {block.citation}</cite> : null}
      </blockquote>
    );
  }

  if (block.type === "list") {
    const ListTag = block.style === "ordered" ? "ol" : "ul";
    return (
      <ListTag key={block.id} style={{ marginBottom: "20px", paddingLeft: "24px" }}>
        {block.items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: "8px" }}>{item}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "code") {
    return (
      <pre key={block.id} style={{ margin: "32px 0", padding: "20px", background: "var(--surface-light)", borderRadius: "var(--radius-button)", overflow: "auto" }}>
        <code style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>{block.code}</code>
      </pre>
    );
  }

  if (block.type === "divider") {
    return <hr key={block.id} style={{ margin: "40px 0", border: "none", borderTop: "1px solid var(--border-light)" }} />;
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
    <div style={{ background: "var(--bg-light)", color: "var(--text-light)", minHeight: "100vh" }}>
      <div className="page-container">
        <SiteHeader variant="secondary" />

        <article style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 0" }}>
          <div style={{ marginBottom: "12px", fontSize: "0.875rem", color: "var(--text-light-muted)" }}>
            <Link href="/" style={{ color: "inherit" }}>首页</Link>
            <span> / </span>
            <Link href={`/categories/${article.category.slug}`} style={{ color: "inherit" }}>{article.category.name}</Link>
          </div>

          <h1 style={{ marginBottom: "16px" }}>{article.title}</h1>
          <p style={{ fontSize: "1.125rem", color: "var(--text-light-muted)", marginBottom: "24px" }}>
            {article.lede}
          </p>

          <div style={{ display: "flex", gap: "16px", fontSize: "0.875rem", color: "var(--text-light-muted)", marginBottom: "40px" }}>
            <span>{article.publishedAt}</span>
            <span>{article.readingTime}</span>
            <span>{article.authorDisplayName}</span>
          </div>

          {article.coverUrl ? (
            <Image
              src={article.coverUrl}
              alt={article.title}
              width={720}
              height={480}
              style={{ width: "100%", height: "auto", borderRadius: "var(--radius-image)", marginBottom: "40px" }}
              priority
            />
          ) : null}

          <div style={{ fontFamily: "var(--font-body), var(--font-chinese), serif" }}>
            {article.sections.map((section) => (
              <section key={section.id} style={{ marginBottom: "48px" }}>
                <h2 style={{ marginBottom: "24px" }}>{section.heading}</h2>
                {section.blocks.map(renderBlock)}
              </section>
            ))}
          </div>
        </article>

        <footer className="site-footer">
          <p>皖ICP备2026007447号</p>
          <p>皖公网安备34010402704764号</p>
        </footer>
      </div>
    </div>
  );
}

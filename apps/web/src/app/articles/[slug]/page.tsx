import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ArticleBlock } from "@xblog/contracts";
import { getArticlePageData } from "@/lib/public-api";
import { SiteFooter } from "@/components/site-footer";

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
      title: "文章未找到 | Alex Plum",
    };
  }

  return {
    title: `${article.title} · Alex Plum`,
    description: article.excerpt,
  };
}

function renderBlock(block: ArticleBlock, index: number) {
  if (block.type === "paragraph") {
    const style = (block as any).style;
    if (style) {
      return (
        <p key={block.id} style={{ textAlign: style.textAlign, textWrap: "balance" as any }}>
          <em>{block.text}</em>
        </p>
      );
    }
    return <p key={block.id}>{block.text}</p>;
  }

  if (block.type === "image") {
    const isFullWidth = block.layout === "full";
    const isHalfWidth = block.layout === "half";
    const figureClass = isHalfWidth ? "limit" : isFullWidth ? "full" : "";

    return (
      <figure key={block.id} className={figureClass}>
        <img src={block.url} alt={block.alt} />
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === "heading") {
    return <h2 key={block.id}>{block.text}</h2>;
  }

  if (block.type === "quote") {
    return (
      <blockquote key={block.id}>
        <p>{block.text}</p>
      </blockquote>
    );
  }

  if (block.type === "list") {
    const ListTag = block.style === "ordered" ? "ol" : "ul";
    return (
      <ListTag key={block.id}>
        {block.items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "code") {
    return (
      <pre key={block.id}>
        <code>{block.code}</code>
      </pre>
    );
  }

  if (block.type === "divider") {
    return <hr key={block.id} />;
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
    <div className="post" style={{
      minHeight: "100vh",
      backgroundColor: "#e6e2e0",
      color: "#151515"
    }}>
      <main>
        <article className="post">
          <div className="article-wrap">
            <div className="post-hero">
              <Link href="/">
                <Image
                  src="/images/logo.png"
                  alt="Alex Plum Logo (Occult Elements)"
                  width={44}
                  height={44}
                />
              </Link>
            </div>

            <header>
              <div>
                <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                  {article.title}
                </h1>
                <h2>{article.excerpt}</h2>
                <time dateTime={article.publishedAt}>{article.publishedAt}</time>
              </div>
            </header>

            {article.sections.map((section) =>
              section.blocks.map((block, index) => renderBlock(block, index))
            )}
          </div>
        </article>

        <div className="post-navigation">
          <div>
            {article.related[0] && (
              <div className="nav-previous">
                ← 参阅上一篇<br />
                <Link href={`/articles/${article.related[0].slug}`}>
                  {article.related[0].title}
                </Link>
              </div>
            )}
            {article.related[1] && (
              <div className="nav-next">
                下一篇 →<br />
                <Link href={`/articles/${article.related[1].slug}`}>
                  {article.related[1].title}
                </Link>
              </div>
            )}
          </div>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}

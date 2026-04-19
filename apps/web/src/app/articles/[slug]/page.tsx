import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ArticleBlock } from "@xblog/contracts";
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

function renderBlock(block: ArticleBlock, index: number) {
  if (block.type === "paragraph") {
    return (
      <p
        key={block.id}
        style={{
          fontFamily: "Newsreader, serif",
          fontSize: "18px",
          color: "#151515",
          lineHeight: "1.6",
          marginBottom: "28px",
        }}
      >
        {block.text}
      </p>
    );
  }

  if (block.type === "image") {
    const isFullWidth = block.layout === "full";
    const isHalfWidth = block.layout === "half";
    const width = isFullWidth ? 960 : isHalfWidth ? 336 : 672;
    const containerStyle = isHalfWidth
      ? { display: "flex", justifyContent: "center", margin: "20px 0 0" }
      : { margin: "20px 0 0" };

    return (
      <div key={block.id} style={containerStyle}>
        <figure style={{ display: "flex", flexDirection: "column", gap: "8px", width: isHalfWidth ? "336px" : "100%" }}>
          <div style={{ borderRadius: "8px", overflow: "hidden" }}>
            <Image
              src={block.url}
              alt={block.alt}
              width={width}
              height={isFullWidth ? 400 : isHalfWidth ? 224 : 280}
              style={{ width: "100%", height: "auto", display: "block" }}
              unoptimized
            />
          </div>
          {block.caption ? (
            <figcaption
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#888888",
                textAlign: "center",
              }}
            >
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      </div>
    );
  }

  if (block.type === "heading") {
    return (
      <div key={block.id} style={{ paddingTop: "20px" }}>
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "32px",
            color: "#151515",
            lineHeight: "1.2",
          }}
        >
          {block.text}
        </h2>
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote
        key={block.id}
        style={{
          margin: "32px 0",
          padding: "20px",
          borderLeft: "4px solid #D3D3D1",
          fontStyle: "italic",
          fontFamily: "Newsreader, serif",
          fontSize: "18px",
          color: "#151515",
        }}
      >
        <p>{block.text}</p>
        {block.citation ? (
          <cite
            style={{
              display: "block",
              marginTop: "12px",
              fontSize: "14px",
              color: "#888888",
            }}
          >
            — {block.citation}
          </cite>
        ) : null}
      </blockquote>
    );
  }

  if (block.type === "list") {
    const ListTag = block.style === "ordered" ? "ol" : "ul";
    return (
      <ListTag
        key={block.id}
        style={{
          marginBottom: "28px",
          paddingLeft: "24px",
          fontFamily: "Newsreader, serif",
          fontSize: "18px",
          color: "#151515",
          lineHeight: "1.6",
        }}
      >
        {block.items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: "8px" }}>
            {item}
          </li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "code") {
    return (
      <pre
        key={block.id}
        style={{
          margin: "32px 0",
          padding: "20px",
          background: "#F5F5F5",
          borderRadius: "8px",
          overflow: "auto",
        }}
      >
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#151515",
          }}
        >
          {block.code}
        </code>
      </pre>
    );
  }

  if (block.type === "divider") {
    return (
      <hr
        key={block.id}
        style={{
          margin: "40px 0",
          border: "none",
          borderTop: "1px solid #D3D3D1",
        }}
      />
    );
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
    <div
      style={{
        background: "#E6E2E0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "80px 0",
      }}
    >
      {/* Header */}
      <header
        style={{
          width: "960px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "28px",
            fontWeight: "600",
            color: "#151515",
            textDecoration: "none",
          }}
        >
          XBlog
        </Link>
        <nav style={{ display: "flex", gap: "32px" }}>
          {[
            ["文章", "/"],
            ["分类", "/categories"],
            ["关于", "/#about"],
            ["搜索", "/search"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: "500",
                color: "#888888",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Article Hero */}
      <section
        style={{
          width: "672px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          padding: "120px 0 80px",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: "500",
            color: "#888888",
            letterSpacing: "2px",
            textAlign: "center",
          }}
        >
          {article.category.name}
        </p>
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "56px",
            color: "#151515",
            lineHeight: "1.1",
            textAlign: "center",
          }}
        >
          {article.title}
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#888888",
            textAlign: "center",
          }}
        >
          {article.publishedAt}
        </p>
      </section>

      {/* Article Body */}
      <article
        style={{
          width: "672px",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "80px",
        }}
      >
        {article.sections.map((section) =>
          section.blocks.map((block, index) => renderBlock(block, index))
        )}
      </article>

      {/* Divider */}
      <div style={{ width: "672px", height: "1px", background: "#D3D3D1" }} />

      {/* Post Navigation */}
      <nav
        style={{
          width: "672px",
          display: "flex",
          justifyContent: "space-between",
          padding: "40px 0",
        }}
      >
        {article.related[0] ? (
          <Link
            href={`/articles/${article.related[0].slug}`}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#888888",
              textDecoration: "none",
            }}
          >
            ← {article.related[0].title}
          </Link>
        ) : (
          <span />
        )}
        {article.related[1] ? (
          <Link
            href={`/articles/${article.related[1].slug}`}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#888888",
              textDecoration: "none",
            }}
          >
            {article.related[1].title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {/* Footer */}
      <footer
        style={{
          width: "960px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          paddingTop: "60px",
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#888888",
            }}
          >
            邮件
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#888888",
            }}
          >
            通讯
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#888888",
            }}
          >
            RSS
          </p>
        </div>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#888888",
          }}
        >
          © 2020–2026 Alex Plum
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#999999",
            }}
          >
            皖ICP备2026007447号
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#999999",
            }}
          >
            皖公网安备34010402704764号
          </p>
        </div>
      </footer>
    </div>
  );
}


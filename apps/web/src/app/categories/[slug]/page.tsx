import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="page-container">
      <SiteHeader variant="secondary" />

      <section style={{ padding: "60px 0 40px" }}>
        <h1>{category.name}</h1>
        <p style={{ color: "var(--text-dark-muted)", marginTop: "16px", fontSize: "1.125rem" }}>
          {category.longSummary}
        </p>
        <p style={{ color: "var(--text-dark-muted)", marginTop: "12px", fontSize: "0.875rem" }}>
          {category.articleCountLabel}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px", marginBottom: "60px" }}>
        {articles.map((article) => (
          <Link key={article.slug} href={`/articles/${article.slug}`} className="card" style={{ padding: "0", overflow: "hidden" }}>
            {article.coverUrl ? (
              <Image
                src={article.coverUrl}
                alt={article.title}
                width={320}
                height={213}
                style={{ width: "100%", height: "auto", borderRadius: "var(--radius-image) var(--radius-image) 0 0" }}
              />
            ) : null}
            <div style={{ padding: "20px" }}>
              <h3 style={{ marginBottom: "8px" }}>{article.title}</h3>
              <p style={{ color: "var(--text-dark-muted)", fontSize: "0.875rem", marginBottom: "12px" }}>
                {article.excerpt}
              </p>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", color: "var(--text-dark-muted)" }}>
                <span>{article.kindLabel}</span>
                <span>{article.readingTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

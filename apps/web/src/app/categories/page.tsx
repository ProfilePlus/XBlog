import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getCategoryOverviewCards } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoryOverviewCards();

  return (
    <div className="page-container">
      <SiteHeader variant="secondary" />

      <section style={{ padding: "60px 0 40px" }}>
        <h1>分类</h1>
        <p style={{ color: "var(--text-dark-muted)", marginTop: "16px" }}>
          按主题浏览所有文章
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px", marginBottom: "60px" }}>
        {categories.map((category) => (
          <Link key={category.slug} href={`/categories/${category.slug}`} className="card" style={{ padding: "24px" }}>
            {category.coverUrl ? (
              <Image
                src={category.coverUrl}
                alt={category.name}
                width={300}
                height={200}
                style={{ borderRadius: "var(--radius-image)", marginBottom: "16px", width: "100%", height: "auto" }}
              />
            ) : null}
            <h3>{category.name}</h3>
            <p style={{ color: "var(--text-dark-muted)", marginTop: "8px" }}>{category.summary}</p>
            <p style={{ color: "var(--text-dark-muted)", fontSize: "0.875rem", marginTop: "12px" }}>
              {category.articleCountLabel}
            </p>
          </Link>
        ))}
      </section>

      <footer className="site-footer">
        <p>皖ICP备2026007447号</p>
        <p>皖公网安备34010402704764号</p>
      </footer>
    </div>
  );
}

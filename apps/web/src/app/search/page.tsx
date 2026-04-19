import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "搜索 | XBlog",
  description: "搜索 XBlog 已发布的公开文章。",
};

export default async function SearchPage() {
  return (
    <div className="page-container">
      <SiteHeader variant="secondary" />

      <section style={{ padding: "60px 0 40px" }}>
        <h1>搜索</h1>
        <p style={{ color: "var(--text-dark-muted)", marginTop: "16px" }}>
          搜索功能开发中
        </p>
      </section>

      <section style={{ marginBottom: "60px" }}>
        <input
          type="search"
          placeholder="输入关键词搜索..."
          style={{ width: "100%", maxWidth: "600px" }}
        />
      </section>

      <footer className="site-footer">
        <p>皖ICP备2026007447号</p>
        <p>皖公网安备34010402704764号</p>
      </footer>
    </div>
  );
}

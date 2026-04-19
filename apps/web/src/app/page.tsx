import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getHomePageData } from "@/lib/public-api";

const FEATURED_ARTICLES = [
  {
    title: "Vibe Coding：超越机器的编程哲学",
    image: "/images/beyond-the-machine.png",
    category: "AI 与编程",
  },
  {
    title: "K8s Pod 调度的艺术",
    image: "/images/easy-hard.jpg",
    category: "云原生",
  },
  {
    title: "RAG 实现：从理论到实践",
    image: "/images/the-webs-grain.jpg",
    category: "大模型",
  },
  {
    title: "Java 虚拟线程深度解析",
    image: "/images/what-screens-want.jpg",
    category: "Java",
  },
  {
    title: "AI Agent 架构设计",
    image: "/images/only-openings.jpg",
    category: "AI",
  },
  {
    title: "微服务边界的思考",
    image: "/images/borderlands.jpg",
    category: "架构",
  },
];

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <div className="page-container">
      <SiteHeader />

      <section style={{ padding: "60px 0 40px" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "16px" }}>Alex Plum</h1>
        <p style={{ fontSize: "1.25rem", color: "var(--text-dark-muted)", marginBottom: "8px" }}>
          合肥程序员 / Java / K8s / AI / 大模型 / Vibe Coding
        </p>
      </section>

      <div style={{ height: "1px", background: "var(--border-dark)", margin: "0 0 60px" }} />

      <section style={{ marginBottom: "60px" }}>
        <h2 style={{ marginBottom: "32px" }}>Writing</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {FEATURED_ARTICLES.map((article) => (
            <div key={article.title} style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <Image
                src={article.image}
                alt={article.title}
                width={336}
                height={224}
                style={{ borderRadius: "var(--radius-image)", flexShrink: 0 }}
              />
              <div>
                <h3 style={{ marginBottom: "8px" }}>{article.title}</h3>
                <p style={{ color: "var(--text-dark-muted)" }}>{article.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <p>皖ICP备2026007447号</p>
        <p>皖公网安备34010402704764号</p>
      </footer>
    </div>
  );
}

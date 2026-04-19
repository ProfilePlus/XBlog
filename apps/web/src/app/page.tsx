import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getHomePageData } from "@/lib/public-api";

export const metadata = {
  title: "XBlog",
  description: "技术思考与工具探索",
};

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <div style={{
      background: "#000000",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "80px 0",
    }}>
      <SiteHeader variant="default" />

      {/* Intro */}
      <section style={{
        width: "960px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        padding: "60px 0 40px",
      }}>
        <h1 style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "48px",
          color: "#CCCCCC",
          textAlign: "center",
          width: "640px",
        }}>
          Alex Plum
        </h1>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "18px",
          color: "#666666",
          textAlign: "center",
          width: "640px",
        }}>
          程序员 · 合肥
        </p>
        <div style={{ display: "flex", gap: "24px" }}>
          <a href="mailto:943483255@qq.com" style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#CCCCCC",
            textDecoration: "none",
          }}>
            邮件联系
          </a>
          <a href="https://github.com/ProfilePlus" target="_blank" rel="noreferrer" style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#CCCCCC",
            textDecoration: "none",
          }}>
            更多信息
          </a>
        </div>
      </section>

      {/* Divider */}
      <div style={{
        width: "960px",
        paddingTop: "60px",
      }}>
        <div style={{ height: "1px", background: "#333333" }} />
      </div>

      {/* Writing Section */}
      <section style={{
        width: "960px",
        display: "flex",
        flexDirection: "column",
        gap: "48px",
        paddingTop: "40px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "32px", color: "#CCCCCC" }}>
            精选文章
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#666666" }}>
            精选随笔与演讲
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {data.featuredArticles.slice(0, 5).map((article, index) => (
            <Link
              key={article.href}
              href={article.href}
              style={{
                display: "flex",
                gap: "24px",
                padding: "20px",
                background: "#0A0A0A",
                border: "1px solid #1A1A1A",
                borderRadius: "12px",
                textDecoration: "none",
              }}
            >
              <div style={{ flex: 1 }}>
                {article.coverUrl ? (
                  <Image
                    src={article.coverUrl}
                    alt={article.title}
                    width={400}
                    height={200}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "200px", background: "#1A1A1A", borderRadius: "8px" }} />
                )}
              </div>
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "12px",
              }}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#666666", letterSpacing: "1px" }}>
                  {article.category}
                </p>
                <h3 style={{ fontFamily: "Newsreader, serif", fontSize: "24px", color: "#CCCCCC", lineHeight: "1.3" }}>
                  {article.title}
                </h3>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#888888", lineHeight: "1.6" }}>
                  {article.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Working On */}
      <section style={{ width: "960px", display: "flex", flexDirection: "column", gap: "24px", paddingTop: "60px" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "32px", color: "#CCCCCC" }}>
          最近在做
        </h2>
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1, padding: "20px", background: "#0A0A0A", border: "1px solid #1A1A1A", borderRadius: "12px" }}>
            <p style={{ fontFamily: "Newsreader, serif", fontSize: "18px", color: "#CCCCCC", marginBottom: "12px" }}>XBlog 重构</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#888888", lineHeight: "1.6" }}>用 Next.js + Java 后端重写博客，极简设计，接入大模型搜索。</p>
          </div>
          <div style={{ flex: 1, padding: "20px", background: "#0A0A0A", border: "1px solid #1A1A1A", borderRadius: "12px" }}>
            <p style={{ fontFamily: "Newsreader, serif", fontSize: "18px", color: "#CCCCCC", marginBottom: "12px" }}>AI Agent 实验</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#888888", lineHeight: "1.6" }}>基于 LangChain + 自研工具，构建代码审查与文档生成 Agent。</p>
          </div>
        </div>
      </section>

      {/* Toolbox */}
      <section style={{ width: "960px", display: "flex", flexDirection: "column", gap: "24px", paddingTop: "60px" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "32px", color: "#CCCCCC" }}>
          工具箱
        </h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            ["IntelliJ IDEA", "Java IDE"],
            ["Claude Code", "AI 结对"],
            ["Kubernetes", "容器编排"],
            ["PostgreSQL", "数据库"],
          ].map(([tool, type], index) => (
            <div key={tool} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: index < 3 ? "1px solid #333333" : "none",
            }}>
              <p style={{ fontFamily: "Newsreader, serif", fontSize: "16px", color: "#CCCCCC" }}>{tool}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#666666" }}>{type}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Archive */}
      <section style={{ width: "960px", display: "flex", flexDirection: "column", gap: "32px", paddingTop: "60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "32px", color: "#CCCCCC" }}>归档</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#666666" }}>2009 — 至今</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {data.latestEssays.slice(0, 6).map((entry, index) => (
            <Link key={entry.href} href={entry.href} style={{ display: "flex", justifyContent: "space-between", textDecoration: "none" }}>
              <p style={{ fontFamily: "Newsreader, serif", fontSize: "16px", color: "#CCCCCC" }}>{entry.title}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#555555" }}>近期</p>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ width: "960px", display: "flex", flexDirection: "column", gap: "32px", paddingTop: "80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "32px", color: "#CCCCCC" }}>关于</h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#666666" }}>简历与联系</p>
        </div>
        <div style={{ display: "flex", gap: "48px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            <p style={{ fontFamily: "Newsreader, serif", fontSize: "18px", color: "#CCCCCC", lineHeight: "1.6" }}>我是 Alex Plum，程序员，坐标合肥。主力 Java 后端，日常与 K8s、微服务打交道。</p>
            <p style={{ fontFamily: "Newsreader, serif", fontSize: "18px", color: "#888888", lineHeight: "1.6" }}>这两年深度接入 AI 与大模型——从 RAG 到 Agent，从 Prompt 工程到 Fine-tuning。也迷上了 Vibe Coding：把意图描述清楚，让 AI 生成骨架，人再雕琢细节。效率翻倍，心智负担减半。</p>
            <p style={{ fontFamily: "Newsreader, serif", fontSize: "18px", color: "#888888", lineHeight: "1.6" }}>博客记录实战笔记：Java 踩坑、K8s 调优、大模型落地、Vibe Coding 心得。写原创，也译外部好文，慢慢织成自己的知识网。</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ width: "960px", display: "flex", flexDirection: "column", gap: "20px", paddingTop: "60px" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", color: "#CCCCCC" }}>联系方式</h2>
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            ["Email", "943483255@qq.com"],
            ["GitHub", "github.com/ProfilePlus"],
            ["Twitter", "@ProfilePlus"],
          ].map(([label, value]) => (
            <div key={label} style={{ flex: 1, padding: "20px", background: "#0A0A0A", border: "1px solid #1A1A1A", borderRadius: "12px" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#666666", marginBottom: "8px" }}>{label}</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#CCCCCC" }}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        width: "960px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        paddingTop: "60px",
      }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#555555" }}>邮件</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#555555" }}>通讯</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#555555" }}>RSS</p>
        </div>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#555555" }}>© 2020–2026 Alex Plum</p>
        <div style={{ display: "flex", gap: "16px" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#444444" }}>皖ICP备2026007447号</p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#444444" }}>皖公网安备34010402704764号</p>
        </div>
      </footer>
    </div>
  );
}

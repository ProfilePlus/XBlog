import Image from "next/image";
import Link from "next/link";
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
      borderRadius: "24px",
    }}>
      {/* Header */}
      <header style={{
        width: "960px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
      }}>
        <Link href="/" style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "28px",
          fontWeight: "600",
          color: "#CCCCCC",
          textDecoration: "none",
        }}>
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

      {/* Intro */}
      <section style={{
        width: "900px",
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
          margin: 0,
        }}>
          Alex Plum
        </h1>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "18px",
          color: "#666666",
          textAlign: "center",
          width: "640px",
          margin: 0,
        }}>
          程序员 · 合肥
        </p>
        <p style={{
          fontFamily: "Newsreader, serif",
          fontSize: "18px",
          color: "#888888",
          lineHeight: "1.7",
          textAlign: "center",
          width: "680px",
          margin: 0,
        }}>
          我在代码的迷宫里游荡多年，Java、Spring、K8s 是我熟悉的路径。AI 的到来像一面镜子，映照出能力的边界，也映照出未来的不确定。我既着迷于它赋予的力量，又困惑于它带来的焦虑——这种矛盾本身，或许就是这个时代的真实写照。这个博客是我与 AI 协作的第一次尝试，记录技术、思考与成长，也是对一个问题的持续追问：在算法与人之间，我们如何找到自己的位置？
        </p>
        <div style={{ display: "flex", gap: "24px" }}>
          <a href="mailto:943483255@qq.com" style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: "500",
            color: "#CCCCCC",
            textDecoration: "none",
          }}>
            邮件联系
          </a>
          <a href="https://github.com/ProfilePlus" target="_blank" rel="noreferrer" style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: "500",
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
        <div style={{ height: "1px", background: "#333333", width: "100%" }} />
      </div>

      {/* Writing Section */}
      <section style={{
        width: "900px",
        display: "flex",
        gap: "90px",
        alignItems: "flex-start",
        paddingTop: "100px",
      }}>
        <div className="section-header-sticky" style={{
          width: "180px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontSize: "36px",
            fontWeight: "300",
            color: "#FFFFFF",
            margin: 0,
            lineHeight: "1.1",
          }}>
            精选文章
          </h2>
          <p style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "13px",
            color: "#999999",
            margin: 0,
            lineHeight: "1.4",
          }}>
            精选随笔<br />与演讲
          </p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "70px" }}>
          {data.featuredArticles.slice(0, 6).map((article) => (
            <Link
              key={article.href}
              href={article.href}
              className="article-card"
            >
              {article.coverUrl ? (
                <Image
                  src={article.coverUrl}
                  alt={article.title}
                  width={300}
                  height={200}
                  style={{
                    width: "300px",
                    height: "200px",
                    objectFit: "cover",
                    flexShrink: 0,
                    borderRadius: "5px",
                  }}
                />
              ) : (
                <div style={{
                  width: "300px",
                  height: "200px",
                  background: "#1A1A1A",
                  flexShrink: 0,
                  borderRadius: "5px",
                }} />
              )}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "7px",
                justifyContent: "center",
                maxWidth: "260px",
              }}>
                <h3 style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "20px",
                  fontWeight: "400",
                  color: "#FFFFFF",
                  lineHeight: "1.3",
                  margin: 0,
                }}>
                  {article.title}
                </h3>
                <p style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "14px",
                  color: "#999999",
                  lineHeight: "1.5",
                  margin: 0,
                }}>
                  {article.description}
                </p>
                <p style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "12px",
                  color: "#666666",
                  margin: 0,
                  marginTop: "2px",
                }}>
                  2025
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Working On */}
      <section style={{
        width: "900px",
        display: "flex",
        gap: "90px",
        alignItems: "flex-start",
        paddingTop: "100px",
      }}>
        <div className="section-header-sticky" style={{
          width: "180px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontSize: "36px",
            fontWeight: "300",
            color: "#FFFFFF",
            margin: 0,
            lineHeight: "1.1",
          }}>
            最近在做
          </h2>
        </div>
        <div style={{ flex: 1, display: "flex", gap: "16px" }}>
          <div style={{
            flex: 1,
            padding: "20px",
            background: "#0A0A0A",
            border: "1px solid #1A1A1A",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            <p style={{
              fontFamily: "Newsreader, serif",
              fontSize: "18px",
              color: "#CCCCCC",
              margin: 0,
            }}>
              XBlog 重构
            </p>
            <p style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#888888",
              lineHeight: "1.6",
              margin: 0,
            }}>
              用 Next.js + Java 后端重写博客，极简设计，接入大模型搜索。这是我 Vibe Coding 的第一个完整产物，也是对 AI 协作模式的一次深度实验。
            </p>
          </div>
          <div style={{
            flex: 1,
            padding: "20px",
            background: "#0A0A0A",
            border: "1px solid #1A1A1A",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            <p style={{
              fontFamily: "Newsreader, serif",
              fontSize: "18px",
              color: "#CCCCCC",
              margin: 0,
            }}>
              AI 工具链探索
            </p>
            <p style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#888888",
              lineHeight: "1.6",
              margin: 0,
            }}>
              深度使用 Claude Code、Codex、OpenClaw，研究 MCP、Skills、Agent 架构。探索 AI 如何真正提升而非替代人的创造力。
            </p>
          </div>
          <div style={{
            flex: 1,
            padding: "20px",
            background: "#0A0A0A",
            border: "1px solid #1A1A1A",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            <p style={{
              fontFamily: "Newsreader, serif",
              fontSize: "18px",
              color: "#CCCCCC",
              margin: 0,
            }}>
              本地大模型实验
            </p>
            <p style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#888888",
              lineHeight: "1.6",
              margin: 0,
            }}>
              基于 Ollama、vLLM 搭建本地推理服务，测试开源模型的能力边界。在焦虑与兴奋之间，寻找 AI 与人协作的最佳平衡点。
            </p>
          </div>
        </div>
      </section>

      {/* Toolbox */}
      <section style={{
        width: "960px",
        display: "flex",
        gap: "80px",
        alignItems: "flex-start",
        paddingTop: "120px",
      }}>
        <div className="section-header-sticky" style={{
          width: "280px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontSize: "36px",
            fontWeight: "300",
            color: "#FFFFFF",
            margin: 0,
            lineHeight: "1.1",
          }}>
            工具箱
          </h2>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {[
            ["Java", "后端开发主力语言，Spring 生态深度使用者"],
            ["Python", "AI 工具链、数据处理、自动化脚本"],
            ["Claude Code", "AI 结对编程，Vibe Coding 核心工具"],
            ["Codex", "OpenAI 代码生成，辅助开发与重构"],
            ["OpenClaw", "自动化浏览器操作，信息采集利器"],
            ["MCP / Skills", "上下文工程与 CLI 技能系统"],
            ["Docker / K8s", "容器化部署，生产环境微服务编排"],
            ["Spring Boot", "Java 微服务框架，企业级应用基石"],
            ["MySQL / PostgreSQL", "关系型数据库，数据持久化方案"],
            ["Ollama / vLLM", "本地大模型推理，开源 LLM 实验"],
            ["Computer Use", "桌面自动化，AI Agent 操作代理"],
            ["UI 设计", "审美提升，frankchimero.com 学习中"],
            ["macOS / Windows", "双系统开发环境，跨平台工作流"],
          ].map(([tool, desc], index) => (
            <div key={tool} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: index < 12 ? "1px solid #333333" : "none",
            }}>
              <p style={{
                fontFamily: "Newsreader, serif",
                fontSize: "16px",
                color: "#CCCCCC",
                margin: 0,
              }}>
                {tool}
              </p>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#666666",
                margin: 0,
              }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Archive */}
      <section style={{
        width: "960px",
        display: "flex",
        gap: "80px",
        alignItems: "flex-start",
        paddingTop: "120px",
      }}>
        <div className="section-header-sticky" style={{
          width: "280px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontSize: "36px",
            fontWeight: "300",
            color: "#FFFFFF",
            margin: 0,
            lineHeight: "1.1",
          }}>
            归档
          </h2>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            color: "#666666",
            margin: 0,
            lineHeight: "1.6",
          }}>
            2009 — 至今
          </p>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {data.latestEssays.slice(0, 6).map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              <p style={{
                fontFamily: "Newsreader, serif",
                fontSize: "16px",
                color: "#CCCCCC",
                margin: 0,
              }}>
                {entry.title}
              </p>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#555555",
                margin: 0,
              }}>
                近期
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" style={{
        width: "960px",
        display: "flex",
        gap: "80px",
        alignItems: "flex-start",
        paddingTop: "160px",
      }}>
        <div style={{
          width: "280px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontSize: "36px",
            fontWeight: "300",
            color: "#FFFFFF",
            margin: 0,
            lineHeight: "1.1",
          }}>
            关于
          </h2>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            color: "#666666",
            margin: 0,
            lineHeight: "1.6",
          }}>
            简历与联系
          </p>
        </div>
        <div style={{ display: "flex", gap: "48px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            <p style={{
              fontFamily: "Newsreader, serif",
              fontSize: "18px",
              color: "#CCCCCC",
              lineHeight: "1.6",
              margin: 0,
            }}>
              我是 Alex Plum，程序员，坐标合肥。主力 Java 后端，日常与 K8s、微服务打交道。
            </p>
            <p style={{
              fontFamily: "Newsreader, serif",
              fontSize: "18px",
              color: "#888888",
              lineHeight: "1.6",
              margin: 0,
            }}>
              这两年深度接入 AI 与大模型——从 RAG 到 Agent，从 Prompt 工程到 Fine-tuning。也迷上了 Vibe Coding：把意图描述清楚，让 AI 生成骨架，人再雕琢细节。效率翻倍，心智负担减半。
            </p>
            <p style={{
              fontFamily: "Newsreader, serif",
              fontSize: "18px",
              color: "#888888",
              lineHeight: "1.6",
              margin: 0,
            }}>
              博客记录实战笔记：Java 踩坑、K8s 调优、大模型落地、Vibe Coding 心得。写原创，也译外部好文，慢慢织成自己的知识网。
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{
        width: "960px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        paddingTop: "60px",
      }}>
        <h2 style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "28px",
          color: "#CCCCCC",
          margin: 0,
        }}>
          联系方式
        </h2>
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            ["Email", "943483255@qq.com"],
            ["GitHub", "github.com/ProfilePlus"],
            ["Twitter", "@ProfilePlus"],
          ].map(([label, value]) => (
            <div key={label} style={{
              flex: 1,
              padding: "20px",
              background: "#0A0A0A",
              border: "1px solid #1A1A1A",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "#666666",
                margin: 0,
              }}>
                {label}
              </p>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                color: "#CCCCCC",
                margin: 0,
              }}>
                {value}
              </p>
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
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#555555",
            margin: 0,
          }}>
            邮件
          </p>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#555555",
            margin: 0,
          }}>
            通讯
          </p>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#555555",
            margin: 0,
          }}>
            RSS
          </p>
        </div>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          color: "#555555",
          margin: 0,
        }}>
          © 2020–2026 Alex Plum
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            color: "#444444",
            margin: 0,
          }}>
            皖ICP备2026007447号
          </p>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            color: "#444444",
            margin: 0,
          }}>
            皖公网安备34010402704764号
          </p>
        </div>
      </footer>
    </div>
  );
}


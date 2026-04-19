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
        gap: "20px",
        padding: "60px 0 40px",
      }}>
        <h1 style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "48px",
          color: "#CCCCCC",
          margin: 0,
        }}>
          Alex Plum
        </h1>
        <p style={{
          fontFamily: "Newsreader, serif",
          fontSize: "18px",
          color: "#888888",
          lineHeight: "1.7",
          margin: 0,
          maxWidth: "720px",
        }}>
          后端开发者。构建系统，也观察系统。<br />
          在技术不断替人作答的时代，继续追问人的位置。
        </p>
        <p style={{
          fontFamily: "Newsreader, serif",
          fontSize: "13px",
          color: "#555555",
          lineHeight: "1.6",
          margin: 0,
          maxWidth: "720px",
          marginTop: "4px",
        }}>
          当欲望失去了枷锁，就没有了向前的路，只能转左，或者向右，左边是地狱，右边也是地狱。
        </p>
        <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
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
        <div style={{ flex: 1, display: "flex", gap: "24px" }}>
          <div style={{
            flex: 1,
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
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", maxWidth: "560px" }}>
          <p style={{
            fontFamily: "Newsreader, serif",
            fontSize: "18px",
            color: "#CCCCCC",
            lineHeight: "1.7",
            margin: 0,
          }}>
            我是 Alex Plum，一名长期在后端世界里工作的开发者。
          </p>
          <p style={{
            fontFamily: "Newsreader, serif",
            fontSize: "18px",
            color: "#888888",
            lineHeight: "1.7",
            margin: 0,
          }}>
            我熟悉 Java、Spring、MySQL、PostgreSQL、Docker 与 K8s，也持续使用 Python、自动化工具和本地模型重写自己的工作流。
          </p>
          <p style={{
            fontFamily: "Newsreader, serif",
            fontSize: "18px",
            color: "#888888",
            lineHeight: "1.7",
            margin: 0,
          }}>
            我对技术始终抱有热情，但比起"能做什么"，我更在意"为什么要做"。AI 正在放大能力，也在放大欲望；它让实现变得轻易，让答案变得廉价，也让判断变得比以往更稀缺。技术可以替人完成越来越多的部分，但方向、限度和承担，最终仍然只能由人自己决定。
          </p>
          <p style={{
            fontFamily: "Newsreader, serif",
            fontSize: "18px",
            color: "#888888",
            lineHeight: "1.7",
            margin: 0,
          }}>
            我写这个博客，不只是为了记录技术实践，也为了记录一种持续的追问：
          </p>
          <p style={{
            fontFamily: "Newsreader, serif",
            fontSize: "16px",
            color: "#666666",
            lineHeight: "1.8",
            margin: 0,
            fontStyle: "italic",
          }}>
            当工具越来越强，人如何不在其中失去自己？<br />
            当效率成为时代共识，什么还能构成真正的价值？<br />
            当欲望越来越容易被满足，边界是否反而成了更重要的能力？
          </p>
          <p style={{
            fontFamily: "Newsreader, serif",
            fontSize: "18px",
            color: "#888888",
            lineHeight: "1.7",
            margin: 0,
          }}>
            这里会写代码，写系统，写自动化，写模型，<br />
            也写那些无法被优化的问题。
          </p>
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


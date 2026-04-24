import Image from "next/image";
import Link from "next/link";
import { getHomePageData } from "@/lib/public-api";
import { NewsletterForm } from "@/components/newsletter-form";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Alex Plum · 首页",
  description: "Alex Plum - Java 后端开发 & Vibe Coding",
};

export default async function HomePage() {
  const data = await getHomePageData();

  // The return type of getHomePageData is cast to HomePageData but has featuredArticles at runtime
  const featuredArticles = (data as any).featuredArticles || [];
  const latestEssays = data.latestEssays || [];

  return (
    <div id="container">
      <main>
        <div className="index">
          <div className="index-wrap">
            
            {/* 信息介绍 */}
            <section className="info">
              <div className="intro-info">
                <h1>
                  Alex Plum
                  <span>Java 后端开发 & Vibe Coding</span>
                </h1>
                <div>
                  <p>你好，我是 Alex Plum。在严谨的 Java 后端架构与灵动的 "Vibe Coding" 之间，我试图寻找某种数字时代的平衡——既有微服务的精密逻辑，也有 AI 辅助下像呼吸一样自然的创作心流。</p>
                  <p>
                    <Link href="/search"><u>搜索全站</u></Link>&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href="mailto:943483255@qq.com">发送邮件</a>&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href="#about">关于更多</a>
                  </p>
                </div>
              </div>
              <figure>
                <img src="/images/portrait-blur.png" alt="Alex Plum 的肖像" />
              </figure>
            </section>

            {/* Newsletter 模拟 */}
            <section className="newsletter">
              <div>
                <h1>
                  <span>订阅我的</span>
                  博客简讯
                </h1>
                <p style={{ fontSize: "var(--unit-sm)", color: "var(--color-textdim)", marginTop: "1rem", maxWidth: "20rem" }}>
                  与其被算法的信息茧房吞噬，不如通过邮件，在每个周五的清晨分享一点关于技术、艺术与生活的 Vibe。
                </p>
              </div>
              <div>
                <div className="inline-container">
                  <div>
                    <NewsletterForm />
                  </div>
                </div>
              </div>
            </section>

            {/* 重点文章 (写作) */}
            <section className="writing">
              <header>
                <h1>
                  <span>精选</span>
                  文章
                </h1>
              </header>
              <div>
                {featuredArticles.slice(0, 6).map((article: any) => (
                  <Link key={article.href} className="card horz" href={article.href}>
                    <figure>
                      {article.coverUrl ? (
                        <img src={article.coverUrl} alt={article.title} />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "3/2", backgroundColor: "#333", borderRadius: "8px" }} />
                      )}
                    </figure>
                    <div>
                      <u>{article.title}</u>
                      <span>{new Date().getFullYear()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* 书籍推荐 */}
            <section className="book">
              <div>
                <h1>
                  <span>推荐</span>
                  书籍阅读
                </h1>
                <Link href="/categories/reading">Beyond Vibe Coding</Link>
                <Link href="/categories/reading">从程序员到 AI 时代开发者</Link>
                <Link href="/categories/reading">Addy Osmani 著</Link>
              </div>
              <figure>
                <img src="/images/shape-cover.jpg" alt="Beyond Vibe Coding by Addy Osmani" />
              </figure>
            </section>

            {/* 博客文章列表 */}
            <section className="blog" id="writing">
              <header>
                <h1>
                  <span>所有</span>
                  发布博文
                </h1>
              </header>
              <div className="posts">
                <ul className="blogposts">
                  {latestEssays.map((entry: any) => (
                    <li key={entry.href}>
                      <Link href={entry.href}>
                        <span>{entry.title}</span>
                        <time>{new Date().getFullYear() + "." + (new Date().getMonth() + 1).toString().padStart(2, "0") + "." + new Date().getDate().toString().padStart(2, "0")}</time>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            
            <div id="about"></div>
            
            {/* 关于更多 */}
            <section className="about">
              <header>
                <h1>
                  <span>关于</span>
                  简介与思考
                </h1>
              </header>
              <div className="about-block">
                <div className="about-text">
                  <p>我曾在精密的规则里寻找确定性，直到我发现，那些过度完美的构造往往缺少灵魂。现在，我更愿意在逻辑的缝隙中，捕捉那份如呼吸般自然的、属于创造者的律动。</p>

                  <blockquote style={{ borderLeft: "2px solid var(--color-surface)", paddingLeft: "1.5rem", margin: "2rem 0", fontStyle: "italic", color: "var(--color-text)" }}>
                    “当 AI 能够写出最完美的逻辑，我们唯一能剩下的，就是那份‘错得很有灵感’的直觉。”
                  </blockquote>

                  <p>身处这个被大语言模型重塑的时代，我感到了前所未有的期待：我们终于可以从繁琐的样板代码中解脱，去触碰架构的灵魂。但我也在彷徨，当创造力的门槛被无限拉低，我们该如何定义一个开发者的“尊严”？</p>
                  
                  <p>也许，Vibe Coding 并不是某种具体的方法论，而是在自动化的洪流中，为自己保留的一块属于艺术与直觉的孤岛。</p>
                  
                  <p><a href="https://github.com/ProfilePlus">GitHub 档案</a> / <a href="mailto:943483255@qq.com">联系我</a></p>
                </div>
                
                <h2>工作经历</h2>
                <ul className="about-list">
                  <li>
                    <div>
                      <span>Java 后端开发工程师 @ 科大讯飞</span>
                    </div>
                    <time>2023–至今</time>
                  </li>
                  <li>
                    <div>
                      <span>后端研究员 @ 新华三 AI 研究院</span>
                    </div>
                    <time>2021–2023</time>
                  </li>
                  <li>
                    <div>
                      <span>后端开发工程师 @ 南京电力信息</span>
                    </div>
                    <time>2018–2021</time>
                  </li>
                </ul>

                <h2>专业技能</h2>
                <ul className="about-list split">
                  <li><div><a>Java / Spring Cloud</a></div><span>核心生态</span></li>
                  <li><div><a>Docker / K8s</a></div><span>云原生</span></li>
                  <li><div><a>CI/CD / Jenkins</a></div><span>工程效能</span></li>
                  <li><div><a>MySQL / Redis</a></div><span>数据层</span></li>
                  <li><div><a>Prometheus / Grafana</a></div><span>可观测性</span></li>
                  <li><div><a>Arthas / JVM 调优</a></div><span>深度诊断</span></li>
                  <li><div><a>Kafka / RabbitMQ</a></div><span>消息中间件</span></li>
                  <li><div><a>Linux / Shell</a></div><span>系统运维</span></li>
                </ul>
              </div>
            </section>

          </div>
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { getHomePageData } from "@/lib/public-api";

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
                  <p>你好，我是 Alex Plum，一名来自合肥的 Java 后端开发工程师。目前，我正沉浸在 "Vibe Coding" 的世界里，研究如何利用人工智能工具提升编程的直觉与生命力。</p>
                  <p>
                    <a href="mailto:943483255@qq.com">发送邮件</a>&nbsp;&nbsp;&nbsp;&nbsp;
                    <a href="#about">更多信息</a>
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
              </div>
              <div>
                <div className="inline-container">
                  <div>
                    <div className="form-container">
                      <div className="emailoctopus-form-wrapper emailoctopus-form-default">
                        <form className="emailoctopus-form">
                          <div className="main-form">
                            <div>
                              <div className="emailoctopus-form-row form-group mb-2">
                                <input className="form-control" placeholder="你的邮箱地址" type="email" />
                              </div>
                            </div>
                            <input className="btn w-100 btn-primary mb-2" type="submit" value="订阅" />
                          </div>
                        </form>
                      </div>
                    </div>
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
                  简历与简介
                </h1>
              </header>
              <div className="about-block">
                <div className="about-text">
                  <p>我深耕 Java 生态多年，对 Spring Cloud、Redis、Kafka 以及分布式架构有深入研究。我认为代码不仅仅是逻辑的集合，更是一种艺术表达。</p>
                  <p>在工作之余，我喜欢漫步在合肥的天鹅湖畔，或者在安静的咖啡馆里思考下个项目的架构设计。</p>
                  <p><a href="https://github.com/ProfilePlus">GitHub 项目</a> / <a href="https://twitter.com/ProfilePlus">Twitter 动态</a></p>
                </div>
                
                <h2>工作经验</h2>
                <ul className="about-list">
                  <li>
                    <div>
                      <span>高级 Java 开发工程师 @ Tech Corp科技</span>
                    </div>
                    <time>2021–至今</time>
                  </li>
                  <li>
                    <div>
                      <span>后端工程师 @ 某初创公司</span>
                    </div>
                    <time>2018–2021</time>
                  </li>
                </ul>

                <h2>专业技能</h2>
                <ul className="about-list split">
                  <li><div><a>Java</a></div><span>精通</span></li>
                  <li><div><a>Spring Boot</a></div><span>精通</span></li>
                  <li><div><a>微服务架构</a></div><span>熟练</span></li>
                  <li><div><a>MySQL / Redis</a></div><span>熟练</span></li>
                </ul>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

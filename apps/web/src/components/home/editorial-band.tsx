import Link from "next/link";
import { CoverSurface } from "@/components/cover-surface";
import type { CompactEntry } from "@/lib/view-models";

type EditorialBandProps = {
  essays: CompactEntry[];
  logs: CompactEntry[];
  about: {
    intro: string;
    currentTheme: string;
    updateStatus: string;
    metrics: string[];
  };
};

export function EditorialBand({ essays, logs, about }: EditorialBandProps) {
  return (
    <section className="editorial-band">
      <article id="latest" className="feature-essay card glass">
        <div className="section-head">
          <h2>最新文章</h2>
          <span className="soft-link">像翻开一本还在续写的数字刊物</span>
        </div>

        {essays.map((entry) => (
          <Link key={entry.title} href={entry.href} className="mini-essay entry-link">
            <CoverSurface
              alt={entry.title}
              className="mini-cover"
              coverUrl={entry.coverUrl}
              sizes="96px"
              tone={entry.tone}
            />
            <div>
              <strong>{entry.title}</strong>
              <p>{entry.description}</p>
            </div>
          </Link>
        ))}
      </article>

      <article id="reading-log" className="reading-stage card dark">
        <div className="section-head">
          <h2>收录日志</h2>
          <span className="soft-link">把读过的东西慢慢留下来</span>
        </div>

        {logs.map((entry) => (
          <Link key={entry.title} href={entry.href} className="log-item entry-link">
            <CoverSurface
              alt={entry.title}
              className="mini-cover"
              coverUrl={entry.coverUrl}
              sizes="96px"
              tone={entry.tone}
            />
            <div>
              <strong>{entry.title}</strong>
              <p>{entry.description}</p>
            </div>
          </Link>
        ))}
      </article>

      <aside id="about" className="profile-tower">
        <div className="profile-panel card glass">
          <div className="author-row brand-about-row">
            <div className="avatar avatar-large" />
            <div className="brand-about-intro">
              <span className="profile-kicker">站点简介</span>
              <strong>XBlog 编辑台</strong>
              <p>{about.intro}</p>
            </div>
          </div>

          <div className="about-meta-grid">
            <div className="about-meta-card">
              <span>当前主题</span>
              <strong>{about.currentTheme}</strong>
            </div>
            <div className="about-meta-card">
              <span>更新状态</span>
              <strong>{about.updateStatus}</strong>
            </div>
          </div>

          <div className="about-metrics">
            {about.metrics.map((metric) => (
              <span key={metric} className="about-metric-pill">
                {metric}
              </span>
            ))}
          </div>
        </div>

        <div className="quote-panel card glass">
          <blockquote>“不是收集更多文章，而是把每一次阅读变成自己的理解。”</blockquote>
          <p>XBlog 不是为了囤积链接，而是想把读过的好内容，一点点写成自己的语言。</p>
        </div>
      </aside>
    </section>
  );
}

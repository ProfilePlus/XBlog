import Link from "next/link";
import type { AdminArticle } from "@xblog/contracts";
import { AdminShell } from "@/components/admin-shell";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

function statusTone(status: AdminArticle["status"]) {
  if (status === "PUBLISHED") {
    return "is-ok";
  }

  if (status === "HIDDEN") {
    return "is-error";
  }

  return "is-warn";
}

function statusLabel(status: AdminArticle["status"]) {
  if (status === "PUBLISHED") {
    return "approved";
  }

  if (status === "HIDDEN") {
    return "blocked";
  }

  return "pending";
}

function extractHostLabel(url: string | null) {
  if (!url) {
    return "source";
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

function sourceDepth(article: AdminArticle) {
  return article.sourceTrail.length + (article.sourceUrl ? 1 : 0);
}

function needsEdit(article: AdminArticle) {
  return (
    article.title.length > 26 ||
    article.excerpt.length > 70 ||
    article.lede.length > 96 ||
    article.kind === "CURATED" ||
    article.originalLanguage === "en"
  );
}

function isBlocked(article: AdminArticle) {
  return !article.coverUrl || sourceDepth(article) === 0;
}

function canAutoPass(article: AdminArticle) {
  return article.kind === "ORIGINAL" || (sourceDepth(article) >= 2 && !needsEdit(article) && !isBlocked(article));
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isSameDay(value: string | null | undefined) {
  const timestamp = toTimestamp(value);
  if (!timestamp) {
    return false;
  }

  const now = new Date();
  const target = new Date(timestamp);

  return (
    now.getUTCFullYear() === target.getUTCFullYear() &&
    now.getUTCMonth() === target.getUTCMonth() &&
    now.getUTCDate() === target.getUTCDate()
  );
}

function getDeskScore(article: AdminArticle) {
  let score = article.ingestScore ?? 0.58;

  if (article.kind === "ORIGINAL") {
    score += 0.12;
  }
  if (article.coverUrl) {
    score += 0.08;
  }
  if (sourceDepth(article) >= 2) {
    score += 0.12;
  }
  if (needsEdit(article)) {
    score -= 0.08;
  }
  if (isBlocked(article)) {
    score -= 0.16;
  }

  return Math.min(0.97, Math.max(0.42, score));
}

function rewriteBadge(article: AdminArticle) {
  if (article.rewriteMode === "multi-source-original") {
    return "multi-source-original";
  }

  if (article.rewriteMode === "single-source-translation-review") {
    return "single-source-review";
  }

  if (sourceDepth(article) >= 2) {
    return "1+3 结构";
  }

  return article.originalLanguage === "en" ? "单源翻译" : extractHostLabel(article.sourceUrl);
}

function sortByDeskPriority(left: AdminArticle, right: AdminArticle) {
  const priorityDelta = getDeskScore(right) - getDeskScore(left);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const timeDelta =
    toTimestamp(right.sourcePublishedAt ?? right.publishedAt) -
    toTimestamp(left.sourcePublishedAt ?? left.publishedAt);

  if (timeDelta !== 0) {
    return timeDelta;
  }

  return left.title.localeCompare(right.title, "zh-CN");
}

function buildCoverStyle(article: AdminArticle | undefined) {
  if (!article) {
    return undefined;
  }

  if (article.tone === "pink") {
    return {
      background:
        "radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.18), transparent 18%), linear-gradient(180deg, rgba(144, 193, 255, 0.22), rgba(255, 111, 216, 0.2)), rgba(255, 255, 255, 0.02)",
    };
  }

  if (article.tone === "green") {
    return {
      background:
        "radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.18), transparent 18%), linear-gradient(180deg, rgba(121, 215, 255, 0.18), rgba(126, 255, 194, 0.2)), rgba(255, 255, 255, 0.02)",
    };
  }

  if (article.tone === "blue") {
    return {
      background:
        "radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.18), transparent 18%), linear-gradient(180deg, rgba(166, 193, 255, 0.24), rgba(121, 215, 255, 0.16)), rgba(255, 255, 255, 0.02)",
    };
  }

  return {
    background:
      "radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.18), transparent 18%), linear-gradient(180deg, rgba(121, 215, 255, 0.18), rgba(217, 136, 255, 0.18)), rgba(255, 255, 255, 0.02)",
  };
}

export default async function EditorialDeskPage() {
  const user = await getAdminUserOrRedirect();
  const response = await apiFetch("/v1/admin/articles");
  const articles = ((await response.json()) as AdminArticle[]).sort(sortByDeskPriority);
  const deskCandidates = articles.slice(0, 12);
  const autoPassCandidates = deskCandidates.filter((article) => canAutoPass(article));
  const blockedCandidates = deskCandidates.filter((article) => !canAutoPass(article) && isBlocked(article));
  const needsEditCandidates = deskCandidates.filter((article) => !canAutoPass(article) && !isBlocked(article));
  const leadArticle =
    autoPassCandidates.find((article) => sourceDepth(article) > 0) ??
    needsEditCandidates.find((article) => sourceDepth(article) > 0) ??
    deskCandidates.find((article) => sourceDepth(article) > 0) ??
    autoPassCandidates[0] ??
    needsEditCandidates[0] ??
    deskCandidates[0];
  const queueArticles = deskCandidates.filter((article) => article.id !== leadArticle?.id).slice(0, 2);
  const approvedTodayCount = deskCandidates.filter((article) => canAutoPass(article) && isSameDay(article.publishedAt)).length;
  const leadCoverStyle = buildCoverStyle(leadArticle);
  const primarySource = leadArticle?.sourceTrail[0]
    ? {
        eyebrow: "Primary",
        title: leadArticle.sourceTrail[0].sourceName,
        body: leadArticle.sourceTrail[0].publishedAt
          ? `源站质量稳定，发布时间近 ${leadArticle.sourceTrail[0].publishedAt.slice(0, 10)}。`
          : "源站质量稳定，适合作为主来源。",
      }
    : leadArticle
      ? {
          eyebrow: "Primary",
          title: leadArticle.sourceTitle ?? extractHostLabel(leadArticle.sourceUrl),
          body: leadArticle.sourceAuthor
            ? `${leadArticle.sourceAuthor} 提供了当前主来源。`
            : "当前主稿已有可追踪来源。",
        }
      : null;
  const supportingSource = leadArticle?.sourceTrail[1]
    ? {
        eyebrow: "Supporting",
        title: leadArticle.sourceTrail[1].sourceName,
        body: "主题重合度高，利于做综合稿。",
      }
    : leadArticle
      ? {
          eyebrow: "Supporting",
          title: rewriteBadge(leadArticle),
          body: sourceDepth(leadArticle) >= 2 ? "当前稿件已具备多源综合条件。" : "这篇稿目前更像单源整理稿。",
        }
      : null;
  const riskItem = leadArticle
    ? {
        eyebrow: "Risk",
        title: leadArticle.coverUrl ? "封面图可保留" : "封面仍需补图",
        body: leadArticle.coverUrl
          ? "当前封面可直接参与主稿判断。"
          : "这篇稿仍建议补一张更贴近首页气质的封面。",
      }
    : null;

  return (
    <AdminShell hideMasthead userName={user.displayName}>
      <section className="admin-card admin-desk-live-bar">
        <div className="admin-desk-live-copy">
          <div className="admin-inline-actions">
            <p className="admin-kicker">Live Desk</p>
            <span className="admin-chip">Public / Console / API</span>
          </div>
          <p className="admin-subtle">先看今天最该放行的一篇，再回头照看那些还差一点火候的稿子。</p>
        </div>
        <div className="admin-inline-actions">
          <span className="admin-status-pill is-info">AI ingest</span>
          <span className="admin-status-pill is-warn">{deskCandidates.length} pending</span>
          <span className="admin-status-pill is-ok">{approvedTodayCount} approved today</span>
        </div>
      </section>

      <section className="admin-card admin-desk-prototype-hero">
        <div className="admin-desk-prototype-hero-copy">
          <p className="admin-kicker">Editorial Queue</p>
          <h1>主稿优先审阅</h1>
          <p className="admin-subtle">
            先替最重要的一篇定去留，再把其余候选一篇篇摆回合适的位置。
          </p>
        </div>
        <div className="admin-inline-actions">
          <span className="admin-chip">Lead first</span>
          <span className="admin-chip">1+3 结构</span>
          <span className="admin-chip">封面优先</span>
        </div>
      </section>

      <section className="admin-desk-prototype-stat-grid">
        <article className="admin-card admin-desk-prototype-stat-card">
          <p className="admin-kicker">Pending</p>
          <strong>{deskCandidates.length}</strong>
          <p className="admin-subtle">待审核稿件</p>
        </article>
        <article className="admin-card admin-desk-prototype-stat-card">
          <p className="admin-kicker">Auto Pass</p>
          <strong>{autoPassCandidates.length}</strong>
          <p className="admin-subtle">高置信度待放行</p>
        </article>
        <article className="admin-card admin-desk-prototype-stat-card">
          <p className="admin-kicker">Needs Edit</p>
          <strong>{needsEditCandidates.length}</strong>
          <p className="admin-subtle">标题和导语仍偏机器味</p>
        </article>
        <article className="admin-card admin-desk-prototype-stat-card">
          <p className="admin-kicker">Blocked</p>
          <strong>{blockedCandidates.length}</strong>
          <p className="admin-subtle">来源不足或图片异常</p>
        </article>
      </section>

      <section className="admin-desk-prototype-focus-grid">
        <article className="admin-card admin-desk-prototype-lead-card">
          <div className="admin-desk-prototype-cover">
            <div className="admin-desk-prototype-cover-art" style={leadCoverStyle} />
          </div>
          <div className="admin-desk-prototype-copy">
            <p className="admin-kicker">Lead Review</p>
            <div className="admin-inline-actions">
              <span className={`admin-status-pill ${leadArticle ? statusTone(leadArticle.status) : "is-warn"}`}>
                {leadArticle ? statusLabel(leadArticle.status) : "pending"}
              </span>
              {leadArticle ? <span className="admin-chip">{rewriteBadge(leadArticle)}</span> : null}
            </div>
            {leadArticle ? <span className="admin-chip">{getDeskScore(leadArticle).toFixed(2)} score</span> : null}
            <h2>{leadArticle?.title ?? "当前还没有能被推到桌面的主稿"}</h2>
            <p className="admin-subtle">
              {leadArticle?.lede ?? "当内容池出现第一篇稳定稿件后，这里会优先成为今天的主审位。"}
            </p>
            <div className="admin-inline-actions admin-desk-prototype-actions">
              <Link className="admin-pill-button is-ok" href={leadArticle ? `/articles/${leadArticle.id}` : "/articles/new"}>
                通过并发布
              </Link>
              <Link className="admin-pill-button is-info" href={leadArticle ? `/articles/${leadArticle.id}` : "/articles"}>
                编辑后通过
              </Link>
              <Link className="admin-pill-button is-error" href="/articles">
                拒绝
              </Link>
            </div>
          </div>
        </article>

        <article className="admin-card admin-desk-prototype-signal-card">
          <div className="admin-section-head">
            <div>
              <p className="admin-kicker">Signal Strip</p>
              <h2>来源与风险</h2>
            </div>
            <span className="admin-chip">source trail</span>
          </div>
          <div className="admin-desk-prototype-signal-list">
            {[primarySource, supportingSource, riskItem]
              .filter((item): item is NonNullable<typeof item> => Boolean(item))
              .map((item) => (
                <article className="admin-desk-prototype-signal-item" key={`${item.eyebrow}-${item.title}`}>
                  <p className="admin-kicker">{item.eyebrow}</p>
                  <strong>{item.title}</strong>
                  <p className="admin-subtle">{item.body}</p>
                </article>
              ))}
          </div>
        </article>
      </section>

      <section className="admin-card admin-desk-prototype-next-card">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Next Queue</p>
            <h2>接下来处理</h2>
          </div>
          <span className="admin-chip">compact stack</span>
        </div>
        <div className="admin-desk-prototype-next-list">
          {queueArticles.length > 0 ? (
            queueArticles.map((article) => (
              <Link className="admin-desk-prototype-next-item" href={`/articles/${article.id}`} key={article.id}>
                <div className="admin-inline-actions">
                  <span className={`admin-status-pill ${canAutoPass(article) ? "is-info" : "is-warn"}`}>
                    {canAutoPass(article) ? "ready" : "review"}
                  </span>
                  <span className="admin-chip">{rewriteBadge(article)}</span>
                  <span className="admin-chip">{extractHostLabel(article.sourceUrl)}</span>
                </div>
                <h3>{article.title}</h3>
                <p className="admin-subtle">{article.excerpt}</p>
              </Link>
            ))
          ) : (
            <article className="admin-desk-prototype-next-item">
              <h3>当前还没有第二梯队稿件</h3>
              <p className="admin-subtle">当新的候选进入桌面后，这里会形成和原型一致的紧凑堆栈。</p>
            </article>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

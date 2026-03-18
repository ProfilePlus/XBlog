import Image from "next/image";
import type {
  AdminArticle,
  AdminObjectStorageStatus,
  AdminToken,
  HomeIssue,
} from "@xblog/contracts";
import {
  adminObjectStorageStatusSchema,
  homeIssueSchema,
} from "@xblog/contracts";
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
    return "已发布";
  }

  if (status === "HIDDEN") {
    return "已隐藏";
  }

  return "草稿";
}

function kindLabel(kind: AdminArticle["kind"]) {
  return kind === "ORIGINAL" ? "原创写作" : "收录整理";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

export default async function DashboardPage() {
  const user = await getAdminUserOrRedirect();
  const [articlesRes, issueRes, storageRes, tokensRes] = await Promise.all([
    apiFetch("/v1/admin/articles"),
    apiFetch("/v1/admin/home-issue/current"),
    apiFetch("/v1/admin/system/storage"),
    apiFetch("/v1/admin/tokens"),
  ]);

  const [articlesPayload, issuePayload, storagePayload, tokensPayload] = await Promise.all([
    articlesRes.json(),
    issueRes.json(),
    storageRes.json(),
    tokensRes.json(),
  ]);

  const articles = articlesPayload as AdminArticle[];
  const issue = homeIssueSchema.parse(issuePayload) as HomeIssue;
  const storage = adminObjectStorageStatusSchema.parse(storagePayload) as AdminObjectStorageStatus;
  const tokens = tokensPayload as AdminToken[];

  const publishedCount = articles.filter((article) => article.status === "PUBLISHED").length;
  const draftCount = articles.filter((article) => article.status === "DRAFT").length;
  const activeTokenCount = tokens.filter((token) => token.isActive).length;
  const revokedTokenCount = tokens.length - activeTokenCount;
  const lastUsedToken = tokens
    .filter((token) => token.lastUsedAt)
    .sort((left, right) => new Date(right.lastUsedAt ?? 0).getTime() - new Date(left.lastUsedAt ?? 0).getTime())[0];

  const leadArticle =
    articles.find((article) => article.id === issue.heroArticleIds.main) ??
    articles[0];
  const issueSlotArticles = [
    issue.heroArticleIds.main,
    issue.heroArticleIds.side1,
    issue.heroArticleIds.side2,
  ]
    .map((id) => articles.find((article) => article.id === id))
    .filter((article): article is AdminArticle => Boolean(article));

  return (
    <AdminShell hideMasthead userName={user.displayName}>
      <section className="admin-card admin-overview-hero-card">
        <div className="admin-overview-hero-copy">
          <p className="admin-kicker">Control Room</p>
          <h1>概览</h1>
          <p className="admin-subtle">
            左右两栏各自完整。左边只看当前内容和存储，右边只看刊期和令牌，让概览回到安静、对称的状态页。
          </p>
        </div>
        <div className="admin-overview-meta-row">
          <span className="admin-chip">内容池 {articles.length} 篇</span>
          <span className="admin-chip">刊号 {issue.issueNumber}</span>
          <span className={`admin-status-pill ${storage.liveCheck.ok ? "is-ok" : "is-error"}`}>
            存储 {storage.liveCheck.ok ? "可用" : "异常"}
          </span>
          <span className="admin-chip">启用令牌 {activeTokenCount}</span>
        </div>
      </section>

      <section className="admin-overview-summary-grid">
        <article className="admin-card admin-overview-summary-card">
          <span className="admin-kicker">Published</span>
          <strong>{publishedCount}</strong>
          <p className="admin-subtle">当前已对外可见的文章</p>
        </article>
        <article className="admin-card admin-overview-summary-card">
          <span className="admin-kicker">Drafts</span>
          <strong>{draftCount}</strong>
          <p className="admin-subtle">仍在编辑台内等待处理</p>
        </article>
        <article className="admin-card admin-overview-summary-card">
          <span className="admin-kicker">Issue</span>
          <strong>{issueSlotArticles.length}/3</strong>
          <p className="admin-subtle">当前刊期 Hero 槽位绑定进度</p>
        </article>
        <article className="admin-card admin-overview-summary-card">
          <span className="admin-kicker">Tokens</span>
          <strong>{activeTokenCount}</strong>
          <p className="admin-subtle">正在可用的机器令牌</p>
        </article>
      </section>

      <section className="admin-overview-ledger">
        <div className="admin-overview-ledger-column">
          <article className="admin-card admin-overview-content-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Left Rail</p>
                <h2>当前内容</h2>
              </div>
              <span className={`admin-status-pill ${leadArticle ? statusTone(leadArticle.status) : "is-warn"}`}>
                {leadArticle ? statusLabel(leadArticle.status) : "空内容池"}
              </span>
            </div>

            <div className="admin-overview-content-body">
              <div className="admin-overview-content-cover">
                {leadArticle?.coverUrl ? (
                  <Image
                    alt={leadArticle.title}
                    height={420}
                    src={leadArticle.coverUrl}
                    unoptimized
                    width={620}
                  />
                ) : (
                  <div className="admin-overview-content-fallback">
                    <span className="admin-status-pill is-info">
                      {leadArticle ? kindLabel(leadArticle.kind) : "No Story"}
                    </span>
                  </div>
                )}
              </div>

              <div className="admin-overview-content-copy">
                <div className="admin-overview-content-heading">
                  <h3>{leadArticle?.title ?? "当前还没有内容主稿"}</h3>
                  <p className="admin-subtle">
                    {leadArticle?.excerpt ?? "内容池还没有文章，等编辑台建立第一篇主稿后，这里会自动同步当前内容状态。"}
                  </p>
                </div>
                {leadArticle ? (
                  <div className="admin-kv-list">
                    <div className="admin-kv-row">
                      <span className="admin-subtle">内容类型</span>
                      <strong>{kindLabel(leadArticle.kind)}</strong>
                    </div>
                    <div className="admin-kv-row">
                      <span className="admin-subtle">分类</span>
                      <strong>/{leadArticle.categorySlug}</strong>
                    </div>
                    <div className="admin-kv-row">
                      <span className="admin-subtle">阅读时长</span>
                      <strong>{leadArticle.readingTime}</strong>
                    </div>
                    <div className="admin-kv-row">
                      <span className="admin-subtle">作者</span>
                      <strong>{leadArticle.authorDisplayName}</strong>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </article>

          <article className="admin-card admin-overview-status-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Storage</p>
                <h2>对象存储</h2>
              </div>
              <span className={`admin-status-pill ${storage.liveCheck.ok ? "is-ok" : "is-error"}`}>
                {storage.liveCheck.ok ? "可用" : "异常"}
              </span>
            </div>
            <div className="admin-kv-list">
              <div className="admin-kv-row">
                <span className="admin-subtle">Driver</span>
                <strong>{storage.driver}</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">Provider</span>
                <strong>{storage.provider ?? "local-only"}</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">配置状态</span>
                <strong>{storage.diagnostics.ready ? "配置齐全" : "配置未完成"}</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">最近检查</span>
                <strong>{formatDateTime(storage.liveCheck.checkedAt)}</strong>
              </div>
            </div>
            <p className="admin-subtle">最近检查耗时 {storage.liveCheck.durationMs} ms。</p>
          </article>
        </div>

        <div className="admin-overview-ledger-column">
          <article className="admin-card admin-overview-issue-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Right Rail</p>
                <h2>刊期状态</h2>
              </div>
              <span className="admin-status-pill is-info">{issue.issueNumber}</span>
            </div>
            <div className="admin-kv-list">
              <div className="admin-kv-row">
                <span className="admin-subtle">Eyebrow</span>
                <strong>{issue.eyebrow}</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">Hero 标题</span>
                <strong>{issue.title}</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">策展位</span>
                <strong>{issueSlotArticles.length}/3 已绑定</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">当前内容</span>
                <strong>{issueSlotArticles.map((article) => article.title).join(" / ") || "尚未配置"}</strong>
              </div>
            </div>
            <p className="admin-subtle">{issue.lede}</p>
          </article>

          <article className="admin-card admin-overview-status-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Tokens</p>
                <h2>令牌状态</h2>
              </div>
              <span className="admin-status-pill is-info">{activeTokenCount} 启用中</span>
            </div>
            <div className="admin-kv-list">
              <div className="admin-kv-row">
                <span className="admin-subtle">总数</span>
                <strong>{tokens.length} 枚</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">已撤销</span>
                <strong>{revokedTokenCount} 枚</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">最近使用</span>
                <strong>{lastUsedToken ? formatDateTime(lastUsedToken.lastUsedAt) : "暂无调用记录"}</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">主要 scope</span>
                <strong>{tokens[0]?.scopes.join(", ") ?? "暂无 scope"}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </AdminShell>
  );
}

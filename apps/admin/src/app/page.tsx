import type {
  AdminArticle,
  AdminObjectStorageStatus,
  AdminToken,
} from "@xblog/contracts";
import { adminObjectStorageStatusSchema } from "@xblog/contracts";
import { AdminShell } from "@/components/admin-shell";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

export default async function DashboardPage() {
  const user = await getAdminUserOrRedirect();
  const [articlesRes, storageRes, tokensRes] = await Promise.all([
    apiFetch("/v1/admin/articles"),
    apiFetch("/v1/admin/system/storage"),
    apiFetch("/v1/admin/tokens"),
  ]);

  const [articlesPayload, storagePayload, tokensPayload] = await Promise.all([
    articlesRes.json(),
    storageRes.json(),
    tokensRes.json(),
  ]);

  const articles = articlesPayload as AdminArticle[];
  const storage = adminObjectStorageStatusSchema.parse(storagePayload) as AdminObjectStorageStatus;
  const tokens = tokensPayload as AdminToken[];

  const publishedCount = articles.filter((article) => article.status === "PUBLISHED").length;
  const draftCount = articles.filter((article) => article.status === "DRAFT").length;
  const activeTokenCount = tokens.filter((token) => token.isActive).length;
  const latestArticle = [...articles]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];

  return (
    <AdminShell hideMasthead userName={user.displayName}>
      <section className="admin-card">
        <p className="admin-kicker">Control Room</p>
        <h1>概览</h1>
        <p className="admin-subtle">只保留文章、分类、令牌、存储四条主线。其余无用流程全部移除。</p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "24px" }}>
        <article className="admin-card">
          <p className="admin-kicker">Published</p>
          <strong>{publishedCount}</strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Drafts</p>
          <strong>{draftCount}</strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Tokens</p>
          <strong>{activeTokenCount}</strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Storage</p>
          <strong>{storage.liveCheck.ok ? "可用" : "异常"}</strong>
        </article>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
        <article className="admin-card">
          <p className="admin-kicker">Latest Article</p>
          <strong>{latestArticle?.title ?? "暂无文章"}</strong>
          <p style={{ marginTop: "12px", fontSize: "0.875rem", color: "#888" }}>
            最近更新：{formatDateTime(latestArticle?.updatedAt)}
          </p>
        </article>

        <article className="admin-card">
          <p className="admin-kicker">Storage Probe</p>
          <strong>{storage.driver}</strong>
          <p style={{ marginTop: "12px", fontSize: "0.875rem", color: "#888" }}>
            最近检查：{formatDateTime(storage.liveCheck.checkedAt)} / {storage.liveCheck.durationMs} ms
          </p>
        </article>
      </section>
    </AdminShell>
  );
}

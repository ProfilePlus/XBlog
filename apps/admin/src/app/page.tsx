import type {
  AdminArticle,
  AdminObjectStorageStatus,
  AdminToken,
} from "@xblog/contracts";
import { adminObjectStorageStatusSchema } from "@xblog/contracts";
import { AdminShell } from "@/components/admin-shell";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";
import Link from "next/link";

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
    <AdminShell hideMasthead={false} userName={user.displayName}>
      <div className="admin-grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '2.5rem' }}>
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
          <strong style={{ color: storage.liveCheck.ok ? '#10b981' : 'var(--danger)' }}>
            {storage.liveCheck.ok ? "Online" : "Offline"}
          </strong>
        </article>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        <article className="admin-card" style={{ padding: '2.5rem' }}>
          <p className="admin-kicker">Latest Article</p>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>{latestArticle?.title ?? "No Articles"}</h2>
          <p className="admin-subtle">
            Last modified on {formatDateTime(latestArticle?.updatedAt)}
          </p>
          <div style={{ marginTop: '2rem' }}>
             <Link href={`/articles/edit/${latestArticle?.id}`} className="admin-primary-button">
               Continue Editing
             </Link>
          </div>
        </article>

        <article className="admin-card">
          <p className="admin-kicker">System Overview</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
            <div>
              <p className="admin-kicker" style={{ fontSize: '0.65rem' }}>Storage Driver</p>
              <code style={{ fontSize: '0.875rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#475569' }}>{storage.driver}</code>
            </div>
            <div>
              <p className="admin-kicker" style={{ fontSize: '0.65rem' }}>Probe Latency</p>
              <strong style={{ fontSize: '1.25rem' }}>{storage.liveCheck.durationMs}ms</strong>
            </div>
          </div>
        </article>
      </div>
    </AdminShell>
  );
}

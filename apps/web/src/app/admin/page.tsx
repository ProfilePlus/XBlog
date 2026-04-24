import type { AdminArticle, AdminObjectStorageStatus, AdminToken } from "@xblog/contracts";
import { adminObjectStorageStatusSchema } from "@xblog/contracts";
import { AdminShell } from "@/components/admin/admin-shell";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";
import Link from "next/link";
import { formatDateTime } from "@/lib/dates";

export default async function DashboardPage() {
  const user = await getAdminUserOrRedirect();

  const [articlesResponse, tokensResponse, storageResponse] = await Promise.all([
    apiFetch("/v1/admin/articles"),
    apiFetch("/v1/admin/tokens"),
    apiFetch("/v1/admin/system/storage"),
  ]);

  const articles = (await articlesResponse.json()) as AdminArticle[];
  const tokens = (await tokensResponse.json()) as AdminToken[];
  const storage = adminObjectStorageStatusSchema.parse(await storageResponse.json());

  const publishedCount = articles.filter((article) => article.status === "PUBLISHED").length;
  const draftCount = articles.filter((article) => article.status === "DRAFT").length;
  const activeTokenCount = tokens.filter((token) => token.isActive).length;
  const latestArticle = [...articles]
    .sort((left, right) => right.id.localeCompare(left.id))[0];

  return (
    <AdminShell hideMasthead={false} userName={user.displayName}>
      <header style={{ marginBottom: '8rem', transform: 'rotate(-2deg)' }}>
        <p className="admin-kicker" style={{ background: '#fff', color: '#000', display: 'inline-block', padding: '0.2rem 1rem' }}>欢迎归来，{user.displayName.toUpperCase()}</p>
        <h1 style={{ background: 'var(--p5-red)', padding: '0.5rem 2rem' }}>情报概览</h1>
      </header>

      {/* P5 Shattered Stats */}
      <section className="admin-stats-grid" style={{ marginBottom: '10rem' }}>
        <div className="admin-stat-item" style={{ transform: 'rotate(3deg) skew(-5deg)', background: '#fff', border: '5px solid #000' }}>
          <p className="admin-label" style={{ color: '#000', fontWeight: 900 }}>已公示档案</p>
          <strong style={{ fontSize: '6rem', color: '#D50000' }}>{publishedCount}</strong>
        </div>
        <div className="admin-stat-item" style={{ transform: 'rotate(-2deg) skew(5deg)', background: '#D50000', border: '5px solid #fff' }}>
          <p className="admin-label" style={{ color: '#fff', fontWeight: 900 }}>暂存草稿</p>
          <strong style={{ fontSize: '6rem', color: '#fff' }}>{draftCount}</strong>
        </div>
        <div className="admin-stat-item" style={{ transform: 'rotate(1deg) skew(-10deg)', background: '#000', border: '5px solid #D50000' }}>
          <p className="admin-label" style={{ color: '#D50000', fontWeight: 900 }}>密钥令牌</p>
          <strong style={{ fontSize: '6rem', color: '#fff' }}>{activeTokenCount}</strong>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: '6rem' }}>
        <section style={{ background: '#fff', color: '#000', padding: '3rem', transform: 'rotate(-1deg)', border: '10px solid #000' }}>
          <h2 style={{ background: '#000', color: '#fff', padding: '0.5rem 2rem', transform: 'skew(-10deg)', display: 'inline-block' }}>最近捕获的内容</h2>
          
          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '2rem' }}>
              {latestArticle?.title ?? "准备好执行任务了吗？"}
            </h3>
            <div style={{ marginTop: '4rem' }}>
               <Link href={`/admin/articles/${latestArticle?.id}`} className="admin-primary-button" style={{ fontSize: '1.25rem' }}>
                 进入编辑室 &gt;
               </Link>
            </div>
          </div>
        </section>

        <section style={{ border: '5px solid var(--p5-red)', padding: '2rem', transform: 'rotate(2deg)' }}>
          <h2 style={{ background: 'var(--p5-red)', color: '#fff', padding: '0.2rem 1rem' }}>系统脉动</h2>
          <div className="admin-kv-list" style={{ marginTop: '2rem' }}>
             <div className="admin-kv-item" style={{ borderBottom: '3px solid #fff' }}>
                <span style={{ fontWeight: 900 }}>响应延迟</span>
                <span style={{ fontSize: '2rem' }}>{storage.liveCheck.durationMs}MS</span>
             </div>
             <div className="admin-kv-item" style={{ borderBottom: '3px solid #fff' }}>
                <span style={{ fontWeight: 900 }}>存储引擎</span>
                <span style={{ fontSize: '1.5rem' }}>{storage.driver.toUpperCase()}</span>
             </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

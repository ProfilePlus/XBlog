import Link from "next/link";
import type { AdminArticle, AdminArticleListResponse } from "@xblog/contracts";
import { adminArticleListResponseSchema } from "@xblog/contracts";
import { AdminStoryCard } from "@/components/admin/admin-story-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
  }>;
}) {
  const user = await getAdminUserOrRedirect();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 12;

  const articlesResponse = await apiFetch("/v1/admin/articles");
  const articles = (await articlesResponse.json()) as AdminArticle[];

  const publishedCount = articles.filter((article) => article.status === "PUBLISHED").length;
  const draftCount = articles.filter((article) => article.status === "DRAFT").length;
  const hiddenCount = articles.filter((article) => article.status === "HIDDEN").length;

  const total = articles.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  
  const start = (currentPage - 1) * pageSize;
  const pageItems = articles.slice(start, start + pageSize);

  const visibleStart = total === 0 ? 0 : start + 1;
  const visibleEnd = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  return (
    <AdminShell userName={user.displayName}>
      <div className="admin-stats-grid" style={{ marginBottom: '6rem' }}>
        <div className="admin-stat-item" style={{ transform: 'rotate(2deg) skew(-4deg)', background: '#fff', border: '5px solid #000', padding: '2.5rem' }}>
          <p className="admin-label" style={{ color: '#000', fontWeight: 900, marginBottom: '0.5rem' }}>TOTAL ARCHIVE</p>
          <strong style={{ fontSize: '4.5rem', color: '#D50000', lineHeight: 1 }}>{total}</strong>
        </div>
        <div className="admin-stat-item" style={{ transform: 'rotate(-2deg) skew(2deg)', background: '#D50000', border: '5px solid #fff', padding: '2.5rem' }}>
          <p className="admin-label" style={{ color: '#fff', fontWeight: 900, marginBottom: '0.5rem' }}>PUBLISHED</p>
          <strong style={{ fontSize: '4.5rem', color: '#fff', lineHeight: 1 }}>{publishedCount}</strong>
        </div>
        <div className="admin-stat-item" style={{ transform: 'rotate(1.5deg) skew(-2deg)', background: '#000', border: '5px solid var(--p5-red)', padding: '2.5rem' }}>
          <p className="admin-label" style={{ color: 'var(--p5-red)', fontWeight: 900, marginBottom: '0.5rem' }}>DRAFTS</p>
          <strong style={{ fontSize: '4.5rem', color: '#fff', lineHeight: 1 }}>{draftCount}</strong>
        </div>
        <div className="admin-stat-item" style={{ transform: 'rotate(-1deg) skew(4deg)', background: '#fff', border: '5px solid var(--p5-red)', padding: '2.5rem' }}>
          <p className="admin-label" style={{ color: '#000', fontWeight: 900, marginBottom: '0.5rem' }}>HIDDEN</p>
          <strong style={{ fontSize: '4.5rem', color: '#000', lineHeight: 1 }}>{hiddenCount}</strong>
        </div>
      </div>

      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p className="admin-kicker">Article Archive</p>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', margin: 0 }}>文章档案</h2>
        </div>
        <Link href="/articles/new" className="admin-primary-button">新建文章</Link>
      </div>
      
      <div className="admin-articles-stream">
        {pageItems.map((article) => (
          <div key={article.id} className="admin-item-row">
            <div className="admin-item-main">
              <div className="admin-item-title">{article.title}</div>
              <div className="admin-item-slug">/{article.slug}</div>
            </div>
            
            <div className="admin-item-taxonomy">
              <span className="admin-chip">{article.categorySlug}</span>
            </div>

            <div className="admin-item-status">
               <div className="admin-token-status">
                 <span className={`status-dot ${article.status === 'PUBLISHED' ? 'is-active' : 'is-inactive'}`}></span>
                 {statusLabel(article.status)}
               </div>
            </div>

            <div className="admin-item-actions" style={{ textAlign: 'right' }}>
              <Link href={`/admin/articles/${article.id}`} className="admin-ghost-button" style={{ padding: '0.4rem 1.2rem', fontSize: '0.65rem' }}>
                OPEN
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="admin-kicker" style={{ marginBottom: 0 }}>显示 {visibleStart}-{visibleEnd} / 共 {total} 条数据</span>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href={`/articles?page=${currentPage - 1}`} className={`admin-ghost-button ${currentPage <= 1 ? 'is-disabled' : ''}`}>PREV</Link>
          <Link href={`/articles?page=${currentPage + 1}`} className={`admin-ghost-button ${currentPage >= totalPages ? 'is-disabled' : ''}`}>NEXT</Link>
        </div>
      </div>
    </AdminShell>
  );
}

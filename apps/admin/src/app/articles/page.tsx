import Link from "next/link";
import type { AdminArticle, AdminArticleListResponse } from "@xblog/contracts";
import { adminArticleListResponseSchema } from "@xblog/contracts";
import { AdminStoryCard } from "@/components/admin-story-card";
import { AdminShell } from "@/components/admin-shell";
import { AdminPageHeader } from "@/components/admin-page-header";
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

  const [articlesResponse, libraryResponse] = await Promise.all([
    apiFetch("/v1/admin/articles"),
    apiFetch(`/v1/admin/article-library?page=${page}&pageSize=${pageSize}`),
  ]);

  const [articlesPayload, libraryPayload] = await Promise.all([
    articlesResponse.json(),
    libraryResponse.json(),
  ]);

  const articles = articlesPayload as AdminArticle[];
  const library = adminArticleListResponseSchema.parse(libraryPayload) as AdminArticleListResponse;
  const publishedCount = articles.filter((article) => article.status === "PUBLISHED").length;
  const draftCount = articles.filter((article) => article.status === "DRAFT").length;
  const hiddenCount = articles.filter((article) => article.status === "HIDDEN").length;
  const totalPages = Math.max(1, Math.ceil(library.total / library.pageSize));
  const currentPage = library.page;
  const pageItems = library.items;
  const visibleStart = library.total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const visibleEnd = library.total === 0 ? 0 : Math.min(currentPage * pageSize, library.total);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => {
    return value === 1 || value === totalPages || Math.abs(value - currentPage) <= 1;
  });

  return (
    <AdminShell userName={user.displayName}>
      <div className="admin-grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <article className="admin-card">
          <p className="admin-kicker">Total</p>
          <strong>{articles.length}</strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Published</p>
          <strong>{publishedCount}</strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Drafts</p>
          <strong>{draftCount}</strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Hidden</p>
          <strong>{hiddenCount}</strong>
        </article>
      </div>

      <section className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Article Library</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
             <span className="admin-subtle">Page {currentPage} of {totalPages}</span>
          </div>
        </div>
        
        <div className="admin-table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', background: '#f9fafb' }}>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Title</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((article) => (
                <tr key={article.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 500 }}>{article.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{article.slug}</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.875rem' }}>{article.categorySlug}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      background: article.status === 'PUBLISHED' ? '#ecfdf5' : '#fff7ed',
                      color: article.status === 'PUBLISHED' ? '#059669' : '#d97706'
                    }}>
                      {statusLabel(article.status)}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <Link href={`/articles/${article.id}`} style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'underline' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <span className="admin-subtle">Showing {visibleStart}-{visibleEnd} of {library.total}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/articles?page=${currentPage - 1}`} className={`admin-ghost-button ${currentPage <= 1 ? 'is-disabled' : ''}`}>Prev</Link>
            <Link href={`/articles?page=${currentPage + 1}`} className={`admin-ghost-button ${currentPage >= totalPages ? 'is-disabled' : ''}`}>Next</Link>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

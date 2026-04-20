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
      <AdminPageHeader
        eyebrow="Story Library"
        title="文章"
        description="这里收着全部文章。翻页去看时，原创与收录、发布与隐藏都会自己显出边界。"
        actions={
          <Link className="admin-primary-button" href="/articles/new">
            新建文章
          </Link>
        }>
        <span className="admin-chip">总计 {articles.length} 篇</span>
        <span className="admin-chip">已发布 {publishedCount}</span>
        <span className="admin-chip">草稿 {draftCount}</span>
        <span className="admin-chip">隐藏 {hiddenCount}</span>
        <span className="admin-chip">第 {currentPage} / {totalPages} 页</span>
      </AdminPageHeader>

      <section className="admin-grid">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Article Library</p>
            <h2>全部文章</h2>
          </div>
          <div className="admin-inline-actions">
            <span className="admin-chip">每页 {pageSize} 篇</span>
            <span className="admin-chip">内容库分页浏览</span>
          </div>
        </div>
        <div className="admin-story-grid">
          {pageItems.map((article) => (
            <AdminStoryCard
              authorLabel={article.authorDisplayName}
              categoryLabel={`/${article.categorySlug}`}
              compact
              coverUrl={article.coverUrl}
              excerpt={article.excerpt}
              href={`/articles/${article.id}`}
              key={article.id}
              kindLabel={kindLabel(article.kind)}
              readingTime={article.readingTime}
              slug={article.slug}
              statusLabel={statusLabel(article.status)}
              statusTone={statusTone(article.status)}
              title={article.title}
            />
          ))}
        </div>
        {pageItems.length === 0 ? (
          <article className="admin-card admin-section-card">
            <p className="admin-kicker">Empty Library</p>
            <h2>当前页没有文章</h2>
          </article>
        ) : null}
        <div className="admin-library-pagination">
          <div className="admin-inline-actions">
            <span>
              当前显示 {visibleStart}
              {" - "}
              {visibleEnd} / {library.total}
            </span>
          </div>
          <div className="admin-inline-actions">
            <Link
              aria-disabled={currentPage <= 1}
              className={`admin-ghost-button ${currentPage <= 1 ? "is-disabled" : ""}`}
              href={currentPage <= 1 ? "/articles" : `/articles?page=${currentPage - 1}`}
            >
              上一页
            </Link>
            {pageNumbers.map((pageNumber, index) => {
              const previous = pageNumbers[index - 1];
              const shouldInsertGap = previous && pageNumber - previous > 1;

              return (
                <div className="admin-inline-actions" key={pageNumber}>
                  {shouldInsertGap ? <span className="admin-chip">...</span> : null}
                  <Link
                    className={`admin-chip ${pageNumber === currentPage ? "is-active" : ""}`}
                    href={pageNumber === 1 ? "/articles" : `/articles?page=${pageNumber}`}
                  >
                    {pageNumber}
                  </Link>
                </div>
              );
            })}
            <Link
              aria-disabled={currentPage >= totalPages}
              className={`admin-ghost-button ${currentPage >= totalPages ? "is-disabled" : ""}`}
              href={currentPage >= totalPages ? `/articles?page=${currentPage}` : `/articles?page=${currentPage + 1}`}
            >
              下一页
            </Link>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

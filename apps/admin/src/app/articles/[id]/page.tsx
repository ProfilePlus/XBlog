import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ArticleEditor } from "@/components/article-editor";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAdminUserOrRedirect();
  const { id } = await params;

  const [articleResponse, categoriesResponse] = await Promise.all([
    apiFetch(`/v1/admin/articles/${id}`),
    apiFetch("/v1/admin/categories"),
  ]);

  if (!articleResponse.ok) {
    notFound();
  }

  const [article, categories] = await Promise.all([articleResponse.json(), categoriesResponse.json()]);

  return (
    <AdminShell userName={user.displayName}>
      <ArticleEditor article={article} categories={categories} />
    </AdminShell>
  );
}

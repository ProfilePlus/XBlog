import { AdminShell } from "@/components/admin-shell";
import { ArticleEditor } from "@/components/article-editor";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function NewArticlePage() {
  const user = await getAdminUserOrRedirect();
  const categoriesResponse = await apiFetch("/v1/admin/categories");
  const categories = await categoriesResponse.json();

  return (
    <AdminShell userName={user.displayName}>
      <ArticleEditor categories={categories} />
    </AdminShell>
  );
}

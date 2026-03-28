import type { AdminCategory } from "@xblog/contracts";
import { AdminShell } from "@/components/admin-shell";
import { AdminPageHeader } from "@/components/admin-page-header";
import { CategoryManager } from "@/components/category-manager";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function CategoriesPage() {
  const user = await getAdminUserOrRedirect();
  const response = await apiFetch("/v1/admin/categories");
  const categories = (await response.json()) as AdminCategory[];

  return (
    <AdminShell userName={user.displayName}>
      <AdminPageHeader
        eyebrow="Taxonomy"
        title="分类管理"
        description="先看每个分类的名字、摘要与封面，再走进去替它写清长说明与代表文章。"
      >
        <span className="admin-chip">共 {categories.length} 个主分类</span>
      </AdminPageHeader>
      <CategoryManager categories={categories} />
    </AdminShell>
  );
}

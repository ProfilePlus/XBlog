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
        description="先浏览分类卡片，再进入独立编辑页维护摘要、Hero 标题和长说明，让信息层级比大表单更清晰。"
      >
        <span className="admin-chip">共 {categories.length} 个主分类</span>
      </AdminPageHeader>
      <CategoryManager categories={categories} />
    </AdminShell>
  );
}

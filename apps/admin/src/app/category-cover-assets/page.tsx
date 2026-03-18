import type { CategoryCoverAssetListResponse } from "@xblog/contracts";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminShell } from "@/components/admin-shell";
import { CategoryCoverAssetManager } from "@/components/category-cover-asset-manager";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function CategoryCoverAssetsPage() {
  const user = await getAdminUserOrRedirect();
  const response = await apiFetch("/v1/admin/category-cover-assets?page=1&pageSize=18");
  const assets = (await response.json()) as CategoryCoverAssetListResponse;

  return (
    <AdminShell userName={user.displayName}>
      <AdminPageHeader
        eyebrow="Cover Library"
        title="分类封面素材库"
        description="把平时收集到的极光图集中收进同一页：分页浏览、按色调和占用状态筛选、批量导入删除，再回到分类编辑页分配封面。"
      >
        <span className="admin-chip">共 {assets.total} 张素材</span>
        <span className="admin-chip">每页 {assets.pageSize} 张</span>
      </AdminPageHeader>
      <CategoryCoverAssetManager initialResponse={assets} />
    </AdminShell>
  );
}

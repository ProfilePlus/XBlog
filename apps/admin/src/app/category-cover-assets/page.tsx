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
        description="这里收着分类封面的来处与去处。按色调筛，按占用看，再决定哪张图该被谁认领。"
      >
        <span className="admin-chip">共 {assets.total} 张素材</span>
        <span className="admin-chip">每页 {assets.pageSize} 张</span>
      </AdminPageHeader>
      <CategoryCoverAssetManager initialResponse={assets} />
    </AdminShell>
  );
}

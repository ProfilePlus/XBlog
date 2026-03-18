import { notFound } from "next/navigation";
import type { AdminCategory, CategoryCoverAssetListResponse } from "@xblog/contracts";
import { AdminShell } from "@/components/admin-shell";
import { CategoryEditor } from "@/components/category-editor";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAdminUserOrRedirect();
  const { id } = await params;
  const [categoryResponse, coverAssetResponse] = await Promise.all([
    apiFetch("/v1/admin/categories"),
    apiFetch("/v1/admin/category-cover-assets?page=1&pageSize=120"),
  ]);
  const categories = (await categoryResponse.json()) as AdminCategory[];
  const coverAssets = (await coverAssetResponse.json()) as CategoryCoverAssetListResponse;
  const category = categories.find((item) => item.id === id);

  if (!category) {
    notFound();
  }

  return (
    <AdminShell userName={user.displayName}>
      <CategoryEditor category={category} coverAssets={coverAssets.items} />
    </AdminShell>
  );
}

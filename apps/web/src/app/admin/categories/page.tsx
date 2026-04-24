import type { AdminCategory } from "@xblog/contracts";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryManager } from "@/components/admin/category-manager";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function CategoriesPage() {
  const user = await getAdminUserOrRedirect();
  const response = await apiFetch("/v1/admin/categories");
  const categories = (await response.json()) as AdminCategory[];

  return (
    <AdminShell userName={user.displayName}>
      <div className="admin-stats-grid" style={{ marginBottom: '6rem' }}>
        <div className="admin-stat-item" style={{ transform: 'rotate(2deg) skew(-4deg)', background: '#fff', border: '5px solid #000', padding: '2.5rem' }}>
          <p className="admin-label" style={{ color: '#000', fontWeight: 900, marginBottom: '0.5rem' }}>领域总数</p>
          <strong style={{ fontSize: '4.5rem', color: '#D50000', lineHeight: 1 }}>{categories.length}</strong>
        </div>
        <div className="admin-stat-item" style={{ transform: 'rotate(-2deg) skew(2deg)', background: '#D50000', border: '5px solid #fff', padding: '2.5rem' }}>
          <p className="admin-label" style={{ color: '#fff', fontWeight: 900, marginBottom: '0.5rem' }}>活跃领域</p>
          <strong style={{ fontSize: '4.5rem', color: '#fff', lineHeight: 1 }}>{categories.length}</strong>
        </div>
      </div>


      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Taxonomy Management</h2>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <CategoryManager categories={categories} />
        </div>
      </div>
    </AdminShell>
  );
}

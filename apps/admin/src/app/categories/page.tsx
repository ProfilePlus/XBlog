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
      <div className="admin-grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <article className="admin-card">
          <p className="admin-kicker">Categories</p>
          <strong>{categories.length}</strong>
        </article>
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

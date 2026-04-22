import type { AdminToken } from "@xblog/contracts";
import { AdminShell } from "@/components/admin-shell";
import { AdminPageHeader } from "@/components/admin-page-header";
import { TokenManager } from "@/components/token-manager";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function TokensPage() {
  const user = await getAdminUserOrRedirect();
  const response = await apiFetch("/v1/admin/tokens");
  const tokens = (await response.json()) as AdminToken[];
  const activeCount = tokens.filter((token) => token.isActive).length;

  return (
    <AdminShell userName={user.displayName}>
      <div className="admin-grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <article className="admin-card">
          <p className="admin-kicker">Total Tokens</p>
          <strong>{tokens.length}</strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Active Access</p>
          <strong style={{ color: activeCount > 0 ? '#10b981' : 'var(--color-text-main)' }}>{activeCount}</strong>
        </article>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>API Access Tokens</h2>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <TokenManager initialTokens={tokens} />
        </div>
      </div>
    </AdminShell>
  );
}

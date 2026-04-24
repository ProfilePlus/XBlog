import type { AdminToken } from "@xblog/contracts";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TokenManager } from "@/components/admin/token-manager";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function TokensPage() {
  const user = await getAdminUserOrRedirect();
  const response = await apiFetch("/v1/admin/tokens");
  const tokens = (await response.json()) as AdminToken[];
  const activeCount = tokens.filter((token) => token.isActive).length;

  return (
    <AdminShell userName={user.displayName}>
      <div className="admin-stats-grid" style={{ marginBottom: '6rem' }}>
        <div className="admin-stat-item" style={{ transform: 'rotate(2deg) skew(-4deg)', background: '#fff', border: '5px solid #000', padding: '2.5rem' }}>
          <p className="admin-label" style={{ color: '#000', fontWeight: 900, marginBottom: '0.5rem' }}>令牌总数</p>
          <strong style={{ fontSize: '4.5rem', color: '#D50000', lineHeight: 1 }}>{tokens.length}</strong>
        </div>
        <div className="admin-stat-item" style={{ transform: 'rotate(-1.5deg) skew(2deg)', background: '#000', border: '5px solid var(--p5-red)', padding: '2.5rem' }}>
          <p className="admin-label" style={{ color: 'var(--p5-red)', fontWeight: 900, marginBottom: '0.5rem' }}>活跃访问</p>
          <strong style={{ fontSize: '4.5rem', color: '#fff', lineHeight: 1 }}>{activeCount}</strong>
        </div>
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

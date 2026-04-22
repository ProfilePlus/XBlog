import { adminObjectStorageStatusSchema } from "@xblog/contracts";
import { AdminShell } from "@/components/admin-shell";
import { AdminPageHeader } from "@/components/admin-page-header";
import { StorageRefreshButton } from "@/components/storage-refresh-button";
import { StorageUploadProbe } from "@/components/storage-upload-probe";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function StoragePage() {
  const user = await getAdminUserOrRedirect();
  const response = await apiFetch("/v1/admin/system/storage");
  const status = adminObjectStorageStatusSchema.parse(await response.json());

  return (
    <AdminShell userName={user.displayName}>
      <div className="admin-grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <article className="admin-card">
          <p className="admin-kicker">Driver</p>
          <strong>{status.driver.toUpperCase()}</strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Status</p>
          <strong style={{ color: status.liveCheck.ok ? '#10b981' : 'var(--danger)' }}>
            {status.liveCheck.ok ? "ONLINE" : "OFFLINE"}
          </strong>
        </article>
        <article className="admin-card">
          <p className="admin-kicker">Latency</p>
          <strong>{status.liveCheck.durationMs}ms</strong>
        </article>
        <article className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StorageRefreshButton />
        </article>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <section className="admin-card">
          <p className="admin-kicker">Configuration</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem' }}>
            {[
              ['Provider', status.provider ?? 'local-only'],
              ['Bucket', status.bucket ?? 'N/A'],
              ['Endpoint', status.endpoint ?? 'N/A'],
              ['Max Upload', `${Math.round(status.maxUploadBytes / 1024 / 1024)} MB`]
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f5', paddingBottom: '8px' }}>
                <span className="admin-subtle">{label}</span>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <p className="admin-kicker">Live Probe</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="admin-subtle">Last Checked</span>
                <span style={{ fontSize: '0.875rem' }}>{new Date(status.liveCheck.checkedAt).toLocaleTimeString()}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="admin-subtle">Writable</span>
                <span style={{ color: status.liveCheck.writable ? '#10b981' : 'var(--danger)', fontWeight: 600 }}>{status.liveCheck.writable ? 'PASSED' : 'FAILED'}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="admin-subtle">Public Readable</span>
                <span style={{ color: status.liveCheck.publicReadable ? '#10b981' : 'var(--danger)', fontWeight: 600 }}>{status.liveCheck.publicReadable ? 'PASSED' : 'FAILED'}</span>
             </div>
          </div>
        </section>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <StorageUploadProbe />
      </div>
    </AdminShell>
  );
}

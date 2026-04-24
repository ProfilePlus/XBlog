import { adminObjectStorageStatusSchema } from "@xblog/contracts";
import { AdminShell } from "@/components/admin/admin-shell";
import { StorageRefreshButton } from "@/components/admin/storage-refresh-button";
import { StorageUploadProbe } from "@/components/admin/storage-upload-probe";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function StoragePage() {
  const user = await getAdminUserOrRedirect();
  const response = await apiFetch("/v1/admin/system/storage");
  const storage = adminObjectStorageStatusSchema.parse(await response.json());

  return (
    <AdminShell userName={user.displayName}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6rem', transform: 'rotate(-1deg)' }}>
        <h1 style={{ background: 'var(--p5-red)', color: '#fff', padding: '0.5rem 2rem' }}>核心存储</h1>
        <StorageRefreshButton />
      </header>

      {/* 核心指标岛屿 */}
      <section className="admin-stats-grid">
        <div className="admin-stat-item" style={{ background: '#000', border: '4px solid var(--p5-red)', transform: 'rotate(2deg)' }}>
          <span className="admin-label" style={{ color: 'var(--p5-red)' }}>DRIVER / 引擎</span>
          <strong className="admin-value-prominent" style={{ color: '#fff' }}>{storage.driver.toUpperCase()}</strong>
        </div>
        <div className="admin-stat-item" style={{ background: '#fff', border: '4px solid #000', transform: 'rotate(-1.5deg)' }}>
          <span className="admin-label" style={{ color: '#000' }}>STATUS / 状态</span>
          <strong className="admin-value-prominent" style={{ color: storage.liveCheck.ok ? 'var(--p5-red)' : 'var(--color-danger)' }}>
            {storage.liveCheck.ok ? "ONLINE" : "OFFLINE"}
          </strong>
        </div>
        <div className="admin-stat-item" style={{ background: 'var(--p5-red)', border: '4px solid #fff', transform: 'rotate(1deg)' }}>
          <span className="admin-label" style={{ color: '#fff' }}>LATENCY / 延迟</span>
          <strong className="admin-value-prominent" style={{ color: '#fff' }}>{storage.liveCheck.durationMs}MS</strong>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '6rem', marginTop: '8rem' }}>
        {/* 详细配置区域 */}
        <section style={{ background: '#fff', padding: '3rem', border: '5px solid #000', transform: 'rotate(-1deg)' }}>
          <h2 style={{ background: '#000', color: '#fff' }}>物理配置</h2>
          <div className="admin-kv-list" style={{ marginTop: '2rem' }}>
            <div className="admin-kv-item" style={{ borderBottom: '2px solid #000' }}>
              <span style={{ fontWeight: 900 }}>服务商</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{storage.provider ?? "LOCAL SYSTEM"}</span>
            </div>
            <div className="admin-kv-item" style={{ borderBottom: '2px solid #000' }}>
              <span style={{ fontWeight: 900 }}>存储桶</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{storage.bucket ?? "N/A"}</span>
            </div>
            <div className="admin-kv-item" style={{ borderBottom: '2px solid #000' }}>
              <span style={{ fontWeight: 900 }}>接入点</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{storage.endpoint ?? "LOCALHOST"}</span>
            </div>
          </div>
        </section>

        {/* 探针详情区域 */}
        <section style={{ border: '5px solid var(--p5-red)', padding: '3rem', transform: 'rotate(1.5deg)' }}>
          <h2 style={{ background: 'var(--p5-red)', color: '#fff' }}>实时链路</h2>
          <div className="admin-kv-list" style={{ marginTop: '2rem' }}>
            <div className="admin-kv-item" style={{ borderBottom: '2px solid var(--p5-red)' }}>
              <span style={{ fontWeight: 900 }}>最后检查</span>
              <span style={{ color: 'var(--p5-red)' }}>{new Date(storage.liveCheck.checkedAt).toLocaleTimeString()}</span>
            </div>
            <div className="admin-kv-item" style={{ borderBottom: '2px solid var(--p5-red)' }}>
              <span style={{ fontWeight: 900 }}>写入测试</span>
              <span style={{ color: storage.liveCheck.writable ? '#000' : 'var(--color-danger)', fontWeight: 900 }}>
                {storage.liveCheck.writable ? "SUCCESS" : "CRITICAL"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 交互操作区域 */}
      <section style={{ marginTop: '10rem', borderTop: '10px solid #000', paddingTop: '4rem', transform: 'skewX(-5deg)' }}>
        <p className="admin-kicker">Field Operations</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ maxWidth: '40rem' }}>
             <h3 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', background: '#000', color: '#fff', display: 'inline-block', padding: '0.2rem 1rem' }}>上传探针测试</h3>
             <p style={{ fontWeight: 700, lineHeight: 1.6 }}>执行一次真实的资源上传与销毁任务。系统将尝试向核心引擎推送临时密件，验证物理链路的读写完整性。</p>
           </div>
           <StorageUploadProbe />
        </div>
      </section>
    </AdminShell>
  );
}

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
      <AdminPageHeader
        eyebrow="Storage Ops"
        title="对象存储"
        description="对象存储是这条发布链路的河道。这里看配置、看探针，也看它此刻是否仍然通畅。"
        actions={<StorageRefreshButton />}
      >
        <span className="admin-chip">Driver {status.driver}</span>
        <span className="admin-chip">Provider {status.provider ?? "local-only"}</span>
      </AdminPageHeader>

      <div className="admin-grid cols-2">
        <div className="admin-card">
          <h2>运行模式</h2>
          <div className="admin-kv-list">
            <div className="admin-kv-row">
              <span>Driver</span>
              <strong>{status.driver}</strong>
            </div>
            <div className="admin-kv-row">
              <span>Provider</span>
              <strong>{status.provider ?? "local-only"}</strong>
            </div>
            <div className="admin-kv-row">
              <span>Bucket</span>
              <strong>{status.bucket ?? "N/A"}</strong>
            </div>
            <div className="admin-kv-row">
              <span>Endpoint</span>
              <strong>{status.endpoint ?? "N/A"}</strong>
            </div>
            <div className="admin-kv-row">
              <span>Public Base URL</span>
              <strong>{status.publicBaseUrl ?? "derived / local"}</strong>
            </div>
            <div className="admin-kv-row">
              <span>Force Path Style</span>
              <strong>{status.forcePathStyle === null ? "N/A" : status.forcePathStyle ? "true" : "false"}</strong>
            </div>
            <div className="admin-kv-row">
              <span>Upload Limit</span>
              <strong>{Math.round(status.maxUploadBytes / 1024 / 1024)} MB</strong>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>实时检查</h2>
          <div className="admin-inline-actions">
            <span className={`admin-status-pill ${status.liveCheck.ok ? "is-ok" : "is-error"}`}>
              {status.liveCheck.ok ? "可用" : "异常"}
            </span>
            <span className="admin-subtle">{new Date(status.liveCheck.checkedAt).toLocaleString("zh-CN")}</span>
          </div>
          <div className="admin-kv-list">
            <div className="admin-kv-row">
              <span>写入</span>
              <strong>{status.liveCheck.writable ? "通过" : "失败"}</strong>
            </div>
            <div className="admin-kv-row">
              <span>公开读取</span>
              <strong>{status.liveCheck.publicReadable ? "通过" : "失败"}</strong>
            </div>
            <div className="admin-kv-row">
              <span>耗时</span>
              <strong>{status.liveCheck.durationMs} ms</strong>
            </div>
          </div>
          <p className="admin-subtle">{status.liveCheck.message}</p>
        </div>

        <div className="admin-card">
          <h2>配置诊断</h2>
          <div className="admin-inline-actions">
            <span className={`admin-status-pill ${status.diagnostics.ready ? "is-ok" : "is-error"}`}>
              {status.diagnostics.ready ? "配置齐全" : "配置未完成"}
            </span>
            <span className="admin-subtle">{status.diagnostics.uploadFlowLabel}</span>
          </div>

          <div className="admin-kv-list">
            <div className="admin-kv-row">
              <span>示例公开 URL</span>
              <strong>{status.diagnostics.samplePublicUrl ?? "当前无法推导"}</strong>
            </div>
          </div>

          {status.diagnostics.missingEnv.length > 0 ? (
            <>
              <p>缺失环境变量</p>
              <ul className="admin-note-list">
                {status.diagnostics.missingEnv.map((item) => (
                  <li key={item}>
                    <code>{item}</code>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="admin-subtle">关键配置已经齐整，这条上传链路现在可以顺着往前走。</p>
          )}

          {status.diagnostics.warnings.length > 0 ? (
            <>
              <p>注意事项</p>
              <ul className="admin-note-list">
                {status.diagnostics.warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <div className="admin-card">
          <h2>联调提示</h2>
          <ul className="admin-note-list">
            {status.diagnostics.hints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="admin-grid">
        <StorageUploadProbe />
      </div>
    </AdminShell>
  );
}

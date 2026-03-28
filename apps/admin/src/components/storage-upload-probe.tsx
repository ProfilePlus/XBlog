"use client";

import { useState } from "react";
import {
  adminObjectStorageUploadProbeSchema,
  type AdminObjectStorageUploadProbe,
} from "@xblog/contracts";
import { useAdminFeedback } from "@/components/admin-feedback";
import { adminConfig } from "@/lib/config";

async function runProbeRequest() {
  const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/system/storage/probe-upload`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: "{}",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`上传探针请求失败: ${response.status}`);
  }

  return adminObjectStorageUploadProbeSchema.parse(await response.json());
}

export function StorageUploadProbe() {
  const [result, setResult] = useState<AdminObjectStorageUploadProbe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { pushFeedback } = useAdminFeedback();

  return (
    <div className="admin-card admin-probe-card">
      <div className="admin-page-head">
        <div>
          <h2>上传探针</h2>
          <p className="admin-subtle">按一遍真实上传流程走完预签名、上传和公开读取，好确认这条链路此刻仍然通畅。</p>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          disabled={isRunning}
          onClick={async () => {
            try {
              setIsRunning(true);
              setError(null);
              const probe = await runProbeRequest();
              setResult(probe);
              pushFeedback({
                tone: probe.ok ? "success" : "error",
                title: probe.ok ? "上传探针通过" : "上传探针失败",
                description: probe.summary,
                ttlMs: probe.ok ? 4200 : 7600,
              });
            } catch (probeError) {
              setResult(null);
              const message = probeError instanceof Error ? probeError.message : "上传探针执行失败。";
              setError(message);
              pushFeedback({
                tone: "error",
                title: "上传探针失败",
                description: message,
                ttlMs: 7600,
              });
            } finally {
              setIsRunning(false);
            }
          }}
        >
          {isRunning ? "探针执行中..." : "执行上传探针"}
        </button>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      {result ? (
        <div className="admin-probe-result">
          <div className="admin-inline-actions">
            <span className={`admin-status-pill ${result.ok ? "is-ok" : "is-error"}`}>
              {result.ok ? "探针通过" : "探针失败"}
            </span>
            <span className="admin-subtle">{new Date(result.checkedAt).toLocaleString("zh-CN")}</span>
            <span className="admin-subtle">{result.durationMs} ms</span>
          </div>

          <p>{result.summary}</p>

          <div className="admin-kv-list">
            <div className="admin-kv-row">
              <span>Driver</span>
              <strong>{result.driver}</strong>
            </div>
            <div className="admin-kv-row">
              <span>Provider</span>
              <strong>{result.provider ?? "local-only"}</strong>
            </div>
            <div className="admin-kv-row">
              <span>探针 URL</span>
              <strong>{result.assetUrl ?? "N/A"}</strong>
            </div>
          </div>

          <div className="admin-probe-steps">
            {result.steps.map((step) => (
              <div key={step.key} className="admin-probe-step">
                <div className="admin-inline-actions">
                  <strong>{step.label}</strong>
                  <span className={`admin-status-pill ${step.ok ? "is-ok" : "is-error"}`}>
                    {step.ok ? "通过" : "失败"}
                  </span>
                  {step.statusCode !== null ? <span className="admin-subtle">HTTP {step.statusCode}</span> : null}
                </div>
                <p className="admin-subtle">{step.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="admin-subtle">它只会临时留下一次上传痕迹，结束后会清掉，不会碰正式文章。</p>
      )}
    </div>
  );
}

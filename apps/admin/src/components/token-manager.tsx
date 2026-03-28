"use client";

import { useState } from "react";
import type { AdminToken } from "@xblog/contracts";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { useAdminFeedback } from "@/components/admin-feedback";
import { adminConfig } from "@/lib/config";

export function TokenManager({ initialTokens }: { initialTokens: AdminToken[] }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [label, setLabel] = useState("OpenClaw");
  const [plainText, setPlainText] = useState("");
  const [pending, setPending] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState<AdminToken | null>(null);
  const { pushFeedback } = useAdminFeedback();
  const activeCount = tokens.filter((token) => token.isActive).length;
  const revokedCount = tokens.length - activeCount;
  const recentlyUsedCount = tokens.filter((token) => {
    if (!token.lastUsedAt) {
      return false;
    }

    return Date.now() - new Date(token.lastUsedAt).getTime() <= 1000 * 60 * 60 * 24 * 30;
  }).length;

  async function refreshTokens() {
    const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/tokens`, {
      credentials: "include",
    });
    setTokens(await response.json());
  }

  async function createToken() {
    setPending(true);
    try {
      const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/tokens`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label,
          scopes: ["ingest:publish"],
        }),
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "创建令牌失败",
          description: failure?.message ?? "这枚令牌还没能签发出来，稍后再试一次。",
        });
        return;
      }

      const payload = await response.json();
      setPlainText(payload.plainTextToken);
      await refreshTokens();
      pushFeedback({
        tone: "success",
        title: "机器令牌已创建",
        description: "明文只会在这里亮一次，最好现在就把它收好。",
        ttlMs: 5600,
      });
    } catch {
      pushFeedback({
        tone: "error",
        title: "创建令牌失败",
        description: "这次签发在路上断开了，再试一次就好。",
      });
    } finally {
      setPending(false);
    }
  }

  async function revokeToken(id: string) {
    setRevokeId(id);
    try {
      const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/tokens/${id}/revoke`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "撤销令牌失败",
          description: failure?.message ?? "这枚令牌暂时还没能停下来，稍后再试一次。",
        });
        return;
      }

      await refreshTokens();
      pushFeedback({
        tone: "success",
        title: "令牌已撤销",
        description: "它已经停笔，之后不会再继续调用写接口。",
      });
    } catch {
      pushFeedback({
        tone: "error",
        title: "撤销令牌失败",
        description: "撤销动作在路上断开了，再试一次就好。",
      });
    } finally {
      setRevokeId(null);
    }
  }

  async function deleteToken(id: string) {
    setDeleteId(id);
    try {
      const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/tokens/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "删除令牌失败",
          description: failure?.message ?? "这枚令牌还没能从列表里撤下，稍后再试一次。",
        });
        return;
      }

      setConfirmToken(null);
      await refreshTokens();
      pushFeedback({
        tone: "success",
        title: "令牌已删除",
        description: "它已经从控制台退场，也不会再继续调用写接口。",
      });
    } catch {
      pushFeedback({
        tone: "error",
        title: "删除令牌失败",
        description: "删除动作在路上断开了，再试一次就好。",
      });
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="admin-token-stack">
      <AdminConfirmDialog
        cancelLabel="保留令牌"
        confirmLabel="删除令牌"
        description={
          confirmToken?.isActive
            ? "删掉之后，这枚仍在生效的令牌会立刻停下，并从列表里彻底退场。"
            : "删掉之后，这枚已撤销的令牌会从列表里彻底退场。"
        }
        onCancel={() => setConfirmToken(null)}
        onConfirm={() => {
          if (!confirmToken) {
            return;
          }
          void deleteToken(confirmToken.id);
        }}
        open={Boolean(confirmToken)}
        pending={Boolean(confirmToken && deleteId === confirmToken.id)}
        title={confirmToken?.isActive ? "要让这枚启用中的令牌退场吗？" : "要把这枚已撤销的令牌彻底收走吗？"}
        tone="danger"
      />
      <section className="admin-token-hero">
        <div className="admin-token-create-stack">
          <article className="admin-card admin-token-create-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">New Machine Token</p>
                <h2>创建新令牌</h2>
                <p className="admin-subtle">在这里签发一枚新的写入令牌，好让 OpenClaw 或别的导入程序继续落笔。</p>
              </div>
              <button className="admin-primary-button" onClick={createToken} type="button">
                {pending ? "创建中..." : "创建令牌"}
              </button>
            </div>
            <div className="admin-form">
              <label>
                新令牌名称
                <input value={label} onChange={(event) => setLabel(event.target.value)} />
              </label>
              <div className="admin-token-scope-row">
                <span className="admin-status-pill is-info">ingest:publish</span>
                <p className="admin-subtle">它允许调用导入接口，把外部整理好的内容安放进 XBlog。</p>
              </div>
              {plainText ? (
                <div className="admin-banner is-success">
                  请立即保存这串明文令牌：
                  <code className="admin-inline-code">{plainText}</code>
                </div>
              ) : null}
            </div>
          </article>

          <article className="admin-card admin-token-context-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Access Flow</p>
                <h2>接入摘要</h2>
              </div>
              <span className="admin-chip">OpenClaw</span>
            </div>
            <div className="admin-token-context-grid">
              <div className="admin-kv-row">
                <span className="admin-subtle">默认 scope</span>
                <strong>ingest:publish</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">启用中</span>
                <strong>{activeCount} 枚</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">最近活跃</span>
                <strong>{recentlyUsedCount} 个接入点</strong>
              </div>
              <div className="admin-kv-row">
                <span className="admin-subtle">当前名称</span>
                <strong>{label || "未命名"}</strong>
              </div>
            </div>
            <p className="admin-subtle">
              明文令牌只会短暂出现一次，最好立刻写入 OpenClaw 环境变量，再让导入链路跑一轮。
            </p>
          </article>
        </div>

        <article className="admin-card admin-token-policy-card">
          <div className="admin-section-head">
            <div>
              <p className="admin-kicker">Access Posture</p>
              <h2>接入状态</h2>
            </div>
          </div>
          <div className="admin-token-metrics">
            <div className="admin-token-metric">
              <span className="admin-kicker">Active</span>
              <strong>{activeCount}</strong>
              <p className="admin-subtle">仍可调用写接口的机器令牌。</p>
            </div>
            <div className="admin-token-metric">
              <span className="admin-kicker">Revoked</span>
              <strong>{revokedCount}</strong>
              <p className="admin-subtle">已撤销但尚未从列表移除的历史令牌。</p>
            </div>
            <div className="admin-token-metric">
              <span className="admin-kicker">Recent Use</span>
              <strong>{recentlyUsedCount}</strong>
              <p className="admin-subtle">近 30 天内出现过调用记录的接入点。</p>
            </div>
          </div>
          <div className="admin-token-guidance">
            <p className="admin-kicker">Rotation Notes</p>
            <ul className="admin-note-list">
              <li>新令牌创建后，明文只展示一次，适合立刻写入 OpenClaw 环境变量。</li>
              <li>撤销不会影响列表回看，但会立刻阻止继续写入。</li>
              <li>删除适合清理已经完成轮换的旧令牌，避免控制台逐渐失焦。</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="admin-card admin-section-card admin-token-list-card">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Issued Tokens</p>
            <h2>现有令牌</h2>
            <p className="admin-subtle">每一枚令牌的前缀、最近一次使用和它是否还在生效，都留在这里给你回看。</p>
          </div>
          <div className="admin-inline-actions">
            <span className="admin-chip">总计 {tokens.length}</span>
            <span className="admin-chip">启用中 {activeCount}</span>
          </div>
        </div>
        <div className="admin-list">
          {tokens.map((token) => (
            <div className="admin-list-item admin-token-list-item" key={token.id}>
              <div className="admin-list-head">
                <div className="admin-list-title">
                  <div className="admin-inline-actions">
                    <span className={`admin-status-pill ${token.isActive ? "is-ok" : "is-error"}`}>
                      {token.isActive ? "启用中" : "已撤销"}
                    </span>
                    <span className="admin-status-pill is-info">{token.scopes.join(", ")}</span>
                  </div>
                  <strong>{token.label}</strong>
                  <p className="admin-subtle">{token.prefix}</p>
                </div>
                <div className="admin-list-tail">
                  <span className="admin-subtle">
                    创建于 {new Date(token.createdAt).toLocaleString("zh-CN")}
                  </span>
                  <span className="admin-subtle">
                    最近使用 {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString("zh-CN") : "尚未使用"}
                  </span>
                </div>
              </div>
              <div className="admin-token-list-footer">
                <div className="admin-inline-actions">
                  <span className="admin-chip">{token.lastUsedAt ? "有运行轨迹" : "待接入"}</span>
                  <span className="admin-chip">{token.isActive ? "可继续写入" : "已停止写入"}</span>
                </div>
                <div className="admin-inline-actions">
                  <button
                    className="admin-ghost-button"
                    disabled={!token.isActive || revokeId === token.id || deleteId === token.id}
                    onClick={() => void revokeToken(token.id)}
                    type="button"
                  >
                    {!token.isActive ? "已撤销" : revokeId === token.id ? "撤销中..." : "撤销"}
                  </button>
                  <button
                    className="admin-danger-button"
                    disabled={deleteId === token.id || revokeId === token.id}
                    onClick={() => setConfirmToken(token)}
                    type="button"
                  >
                    {deleteId === token.id ? "删除中..." : "删除"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

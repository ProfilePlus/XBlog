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
        cancelLabel="Keep"
        confirmLabel="Delete"
        description="Once deleted, this token will be permanently removed and cannot be recovered."
        onCancel={() => setConfirmToken(null)}
        onConfirm={() => {
          if (!confirmToken) return;
          void deleteToken(confirmToken.id);
        }}
        open={Boolean(confirmToken)}
        pending={Boolean(confirmToken && deleteId === confirmToken.id)}
        title="Delete this token?"
        tone="danger"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="admin-card">
          <p className="admin-kicker">Issue New Token</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
            <input 
              style={{ flex: 1 }}
              placeholder="Token Label (e.g. OpenClaw)" 
              value={label} 
              onChange={(e) => setLabel(e.target.value)} 
            />
            <button className="admin-primary-button" onClick={createToken} disabled={pending}>
              {pending ? "Creating..." : "Create Token"}
            </button>
          </div>
          {plainText && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
              <p style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginBottom: '4px' }}>Copy your new token now. It won't be shown again:</p>
              <code style={{ fontSize: '1rem', fontWeight: 700, color: '#14532d' }}>{plainText}</code>
            </div>
          )}
        </div>

        <div className="admin-card">
          <p className="admin-kicker">Access Summary</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-subtle">Active Tokens</span>
                <span style={{ fontWeight: 600 }}>{activeCount}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-subtle">Recent Activity</span>
                <span style={{ fontWeight: 600 }}>{recentlyUsedCount}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', background: '#f9fafb' }}>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Label</th>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Prefix</th>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Last Used</th>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{token.label}</td>
                <td style={{ padding: '16px 24px' }}>
                  <code style={{ fontSize: '0.8125rem', background: '#f4f4f5', padding: '2px 4px', borderRadius: '4px' }}>{token.prefix}</code>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    background: token.isActive ? '#ecfdf5' : '#fef2f2',
                    color: token.isActive ? '#059669' : '#b91c1c'
                  }}>
                    {token.isActive ? 'Active' : 'Revoked'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {token.isActive && (
                      <button 
                        onClick={() => void revokeToken(token.id)}
                        disabled={revokeId === token.id}
                        style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textDecoration: 'underline' }}>
                        Revoke
                      </button>
                    )}
                    <button 
                      onClick={() => setConfirmToken(token)}
                      style={{ fontSize: '0.8125rem', color: 'var(--danger)', textDecoration: 'underline' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

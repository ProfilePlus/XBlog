"use client";

import { useState } from "react";
import type { AdminToken } from "@xblog/contracts";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useAdminFeedback } from "@/components/admin/admin-feedback";
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
        cancelLabel="留它一命"
        confirmLabel="彻底销毁"
        description="一旦执行销毁，该令牌将从意识空间永久抹除，所有关联服务（如 OpenClaw）将立即瘫痪。"
        onCancel={() => setConfirmToken(null)}
        onConfirm={() => {
          if (!confirmToken) return;
          void deleteToken(confirmToken.id);
        }}
        open={Boolean(confirmToken)}
        pending={Boolean(confirmToken && deleteId === confirmToken.id)}
        title="确定要将其物理销毁吗？"
        tone="danger"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '6rem', marginBottom: '8rem' }}>
        <section style={{ background: '#fff', padding: '3rem', border: '8px solid #000', transform: 'rotate(-1deg) skew(-2deg)' }}>
          <p className="admin-kicker" style={{ background: '#000', color: '#fff', display: 'inline-block', padding: '0.2rem 1rem' }}>ISSUE NEW KEY</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2.5rem', color: '#000' }}>签发新令牌</h2>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <input 
              style={{ flex: 1, fontSize: '1.5rem', fontWeight: 900, borderBottom: '5px solid #000' }}
              placeholder="令牌用途标签..." 
              value={label} 
              onChange={(e) => setLabel(e.target.value)} 
            />
            <button className="admin-primary-button" style={{ transform: 'rotate(2deg)' }} onClick={createToken} disabled={pending}>
              {pending ? "正在入侵..." : "执行签发"}
            </button>
          </div>
          {plainText && (
            <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--p5-red)', border: '5px solid #000', transform: 'rotate(1deg)' }}>
              <p style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase' }}>密件：请立即保存（仅显示一次）</p>
              <code style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', wordBreak: 'break-all' }}>{plainText}</code>
            </div>
          )}
        </section>

        <section style={{ background: '#000', padding: '3rem', transform: 'rotate(2deg) skew(2deg)', border: '5px solid var(--p5-red)' }}>
          <p className="admin-kicker" style={{ color: 'var(--p5-red)' }}>ACCESS PULSE</p>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '2.5rem' }}>安全统计</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid var(--p5-red)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--p5-red)' }}>活跃中</span>
                <strong style={{ fontSize: '2.5rem', color: '#fff' }}>{activeCount}</strong>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid var(--p5-red)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--p5-red)' }}>近期使用</span>
                <strong style={{ fontSize: '2.5rem', color: '#fff' }}>{recentlyUsedCount}</strong>
             </div>
          </div>
        </section>
      </div>

      <div className="admin-token-list">
        <p className="admin-kicker" style={{ transform: 'rotate(-1deg)' }}>MANAGED CREDENTIALS</p>
        {tokens.map((token, index) => (
          <div key={token.id} className="admin-token-card" style={{ 
            background: index % 2 === 0 ? '#fff' : 'var(--p5-red)',
            color: index % 2 === 0 ? '#000' : '#fff',
            border: '5px solid #000',
            transform: `rotate(${index % 2 === 0 ? '0.5deg' : '-0.5deg'}) skew(${index % 2 === 0 ? '-1deg' : '1deg'})`,
            padding: '2.5rem',
            marginBottom: '1.5rem'
          }}>
            <div className="admin-token-info">
              <h3 style={{ fontSize: '2rem', fontWeight: 900, color: 'inherit' }}>{token.label}</h3>
              <div style={{ marginTop: '1rem' }}>
                 <code style={{ fontSize: '1rem', background: '#000', color: '#fff', padding: '0.2rem 0.5rem' }}>{token.prefix}...</code>
                 <span style={{ marginLeft: '2rem', fontWeight: 900, fontSize: '0.75rem', opacity: 0.8 }}>
                    LAST USED: {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : 'UNKNOWN'}
                 </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <div style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                 <span className={`status-dot ${token.isActive ? 'is-active' : 'is-inactive'}`} style={{ width: '12px', height: '12px' }}></span>
                 {token.isActive ? 'ACTIVE' : 'REVOKED'}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {token.isActive && (
                  <button 
                    onClick={() => void revokeToken(token.id)}
                    disabled={revokeId === token.id}
                    className="admin-ghost-button"
                    style={{ border: '3px solid currentColor', color: 'inherit', fontWeight: 900 }}>
                    REVOKE
                  </button>
                )}
                <button 
                  onClick={() => setConfirmToken(token)}
                  className="admin-ghost-button"
                  style={{ border: '3px solid #000', background: '#000', color: '#fff', fontWeight: 900 }}>
                  DELETE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

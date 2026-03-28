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
      <AdminPageHeader
        actions={
          <>
            <span className="admin-status-pill is-info">ingest:publish</span>
            <span className={`admin-status-pill ${activeCount > 0 ? "is-ok" : "is-warn"}`}>
              {activeCount} 个活跃接入
            </span>
          </>
        }
        eyebrow="Machine Access"
        title="机器令牌"
        description="把 OpenClaw 与其他写入方的凭据收在这里，方便创建、回看，也方便及时止损。"
      >
        <span className="admin-chip">总计 {tokens.length} 个令牌</span>
        <span className="admin-chip">启用中 {activeCount}</span>
      </AdminPageHeader>
      <TokenManager initialTokens={tokens} />
    </AdminShell>
  );
}

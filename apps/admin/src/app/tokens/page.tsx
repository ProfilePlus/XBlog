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
        eyebrow="Machine Access"
        title="机器令牌"
        description="把 OpenClaw 或其他外部写入方的接入凭据收在一处，方便创建、查看和轮换。"
      >
        <span className="admin-chip">总计 {tokens.length} 个令牌</span>
        <span className="admin-chip">启用中 {activeCount}</span>
      </AdminPageHeader>
      <TokenManager initialTokens={tokens} />
    </AdminShell>
  );
}

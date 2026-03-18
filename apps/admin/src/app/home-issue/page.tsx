import { AdminShell } from "@/components/admin-shell";
import { AdminPageHeader } from "@/components/admin-page-header";
import { HomeIssueForm } from "@/components/home-issue-form";
import { apiFetch, getAdminUserOrRedirect } from "@/lib/api";

export default async function HomeIssuePage() {
  const user = await getAdminUserOrRedirect();
  const [issueResponse, articlesResponse] = await Promise.all([
    apiFetch("/v1/admin/home-issue/current"),
    apiFetch("/v1/admin/articles"),
  ]);
  const [issue, articles] = await Promise.all([issueResponse.json(), articlesResponse.json()]);

  return (
    <AdminShell userName={user.displayName}>
      <AdminPageHeader
        eyebrow="Issue Curation"
        title="刊期管理"
        description="控制首页期号、导语、CTA 和三张 Hero 卡片，让前台第一屏保持明确的策展意图。"
      >
        <span className="admin-chip">当前刊号 {issue.issueNumber}</span>
      </AdminPageHeader>
      <HomeIssueForm issue={issue} articles={articles} />
    </AdminShell>
  );
}

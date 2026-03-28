import Link from "next/link";
import type { ReactNode } from "react";
import { AdminFeedbackRail } from "@/components/admin-feedback";
import { AdminNav } from "@/components/admin-nav";
import { LogoutButton } from "@/components/logout-button";

export function AdminShell({
  userName,
  children,
  hideMasthead = false,
}: {
  userName: string;
  children: ReactNode;
  hideMasthead?: boolean;
}) {
  return (
    <div className="admin-app">
      <div className="admin-aurora admin-aurora-one" />
      <div className="admin-aurora admin-aurora-two" />
      <div className="admin-aurora admin-aurora-three" />

      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-panel">
            <Link className="admin-brand-link" href="/">
              <span className="admin-brand-mark" aria-hidden="true" />
              <div className="admin-brand-copy">
                <strong>XBlog</strong>
                <p>Editorial Core Console</p>
              </div>
            </Link>

            <div className="admin-identity-card">
              <p className="admin-kicker">Operator</p>
              <strong>{userName}</strong>
              <p className="admin-subtle">
                这里像一张长桌，文章、刊期、收录与发布顺序都在桌面上排开。
              </p>
            </div>

            <AdminNav />

            <div className="admin-sidebar-note admin-sidebar-bridge">
              <p className="admin-kicker">Bridge</p>
              <div className="admin-sidebar-links">
                <Link className="admin-sidebar-link" href="http://127.0.0.1:3000" target="_blank">
                  公开站首页
                </Link>
                <Link className="admin-sidebar-link" href="/articles/new">
                  写新文章
                </Link>
              </div>
            </div>

            <div className="admin-sidebar-note">
              <p className="admin-kicker">Runtime</p>
              <div className="admin-inline-actions">
                <span className="admin-status-pill is-info">Prisma</span>
                <span className="admin-status-pill is-info">MinIO</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="admin-content">
          {hideMasthead ? null : (
            <header className="admin-masthead">
              <div className="admin-masthead-copy">
                <div className="admin-masthead-badge-row">
                  <p className="admin-kicker">Live Desk</p>
                  <span className="admin-chip admin-shell-signal">Public / Console / API</span>
                </div>
                <p className="admin-masthead-title">
                  这里不只写字，也照看首页、后台与 API 的节奏，让发布这件事始终有序。
                </p>
              </div>
              <div className="admin-inline-actions admin-masthead-actions">
                <Link className="admin-ghost-button" href="/articles/new">
                  新建文章
                </Link>
                <Link className="admin-ghost-button" href="http://127.0.0.1:3000" target="_blank">
                  查看公开站
                </Link>
                <LogoutButton />
              </div>
            </header>
          )}

          <div className="admin-main-shell">
            <AdminFeedbackRail />
            <main className="admin-main">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}

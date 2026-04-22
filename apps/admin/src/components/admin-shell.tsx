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
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link className="admin-brand-link" href="/">
            <div className="admin-brand-copy">
              <strong>XBlog</strong>
            </div>
          </Link>

          <div className="admin-identity-card">
            <p className="admin-kicker" style={{ color: 'rgba(255,255,255,0.4)' }}>Operator</p>
            <strong>{userName}</strong>
          </div>

          <AdminNav />

          <div style={{ marginTop: 'auto' }}>
            <Link href="http://127.0.0.1:3000" target="_blank" className="admin-nav-link">
              <span className="admin-nav-index">↗</span>
              Public Site
            </Link>
            <LogoutButton />
          </div>
        </aside>

        <div className="admin-content">
          <header className="admin-top-bar">
            <div className="admin-breadcrumb">
               <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Console</span>
            </div>
            <div className="admin-actions" style={{ display: 'flex', gap: '12px' }}>
               <Link href="/articles/new" className="admin-primary-button">
                 New Post
               </Link>
            </div>
          </header>

          <main className="admin-main">
            <AdminFeedbackRail />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

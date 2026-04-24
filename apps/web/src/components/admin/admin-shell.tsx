import Link from "next/link";
import type { ReactNode } from "react";
import { AdminFeedbackRail } from "@/components/admin/admin-feedback";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoutButton } from "@/components/admin/logout-button";

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
    <div className="admin-app admin-root-container">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand-area" style={{ alignItems: 'flex-start' }}>
            <div className="vibe-seal-outer" style={{ width: '80px', height: '80px', background: '#000', borderRadius: '0', clipPath: 'polygon(0 10%, 100% 0, 90% 100%, 5% 90%)', marginBottom: '2rem' }}>
               <img src="/images/logo.png" alt="XBlog Logo" style={{ width: '50px', height: '50px', filter: 'invert(1)' }} />
            </div>
            <div className="admin-brand-copy">
              <strong style={{ fontSize: '3rem', color: '#000', background: '#fff', padding: '0 1rem', display: 'inline-block', transform: 'rotate(-5deg)' }}>XBLOG</strong>
            </div>
          </div>

          <AdminNav />

          <div style={{ marginTop: 'auto' }}>
            <Link href="/" target="_blank" className="admin-nav-link" style={{ background: '#fff', padding: '0.5rem 1rem', transform: 'rotate(2deg)' }}>
              <strong>GO TO SITE ↗</strong>
            </Link>
            <div style={{ marginTop: '1.5rem' }}>
              <LogoutButton />
            </div>
          </div>
        </aside>


        <div className="admin-content">
          <header className="admin-top-bar" style={{ 
            height: '72px', 
            padding: '0 4rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(249, 247, 244, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.02em' }}>内容管理控制台</span>
            <Link href="/admin/articles/new" className="admin-primary-button">
              撰写新文章
            </Link>
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

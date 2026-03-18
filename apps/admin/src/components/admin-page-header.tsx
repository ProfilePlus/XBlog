import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="admin-card admin-page-hero">
      <div className="admin-page-head">
        <div className="admin-page-copy">
          <p className="admin-kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="admin-subtle admin-page-description">{description}</p>
        </div>
        {actions ? <div className="admin-inline-actions">{actions}</div> : null}
      </div>
      {children ? <div className="admin-hero-meta">{children}</div> : null}
    </section>
  );
}

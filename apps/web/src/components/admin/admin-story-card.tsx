import Image from "next/image";
import Link from "next/link";

type AdminStoryCardProps = {
  href: string;
  title: string;
  excerpt: string;
  slug: string;
  statusLabel: string;
  statusTone: string;
  kindLabel: string;
  categoryLabel: string;
  readingTime: string;
  authorLabel: string;
  coverUrl: string | null;
  compact?: boolean;
  featured?: boolean;
};

export function AdminStoryCard({
  href,
  title,
  excerpt,
  slug,
  statusLabel,
  statusTone,
  kindLabel,
  categoryLabel,
  readingTime,
  authorLabel,
  coverUrl,
  compact = false,
  featured = false,
}: AdminStoryCardProps) {
  return (
    <Link
      className={`admin-card admin-link-card admin-story-card ${compact ? "is-compact" : ""} ${featured ? "is-featured" : ""}`}
      href={href}
    >
      <div className="admin-story-card-cover">
        {coverUrl ? (
          <Image alt={title} height={compact ? 260 : 320} src={coverUrl} unoptimized width={640} />
        ) : (
          <div className="admin-story-card-fallback">
            <span className="admin-status-pill is-info">{kindLabel}</span>
          </div>
        )}
      </div>

      <div className="admin-story-card-copy">
        <p className="admin-kicker">{featured ? "Lead Story" : "Story File"}</p>
        <div className="admin-inline-actions">
          <span className={`admin-status-pill ${statusTone}`}>{statusLabel}</span>
          <span className="admin-chip">{kindLabel}</span>
          <span className="admin-chip">{categoryLabel}</span>
        </div>
        <h3>{title}</h3>
        <p className="admin-subtle">{excerpt}</p>
        <div className="admin-story-card-footer">
          <div className="admin-story-card-meta">
            <span>{readingTime}</span>
            <span>{authorLabel}</span>
            <span>/{slug}</span>
          </div>
          <span className="admin-list-arrow">进入编辑</span>
        </div>
      </div>
    </Link>
  );
}

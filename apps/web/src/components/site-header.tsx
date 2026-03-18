import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { getSiteBrandingData } from "@/lib/public-api";
import { adminAppUrl } from "@/lib/site-links";

type SiteHeaderProps = {
  variant?: "default" | "secondary";
};

export async function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const isHome = variant === "default";
  const branding = await getSiteBrandingData();

  return (
    <header className={isHome ? "topbar topbar-home" : "topbar topbar-secondary"}>
      <Link className="brand-link" href="/">
        <div className="brand-lockup" data-logo-variant={branding.logoVariant}>
          <SiteLogo className="brand-logo" variant={branding.logoVariant} />
          <p className="brand-edition">{isHome ? "Aurora Edition" : "Reading System"}</p>
        </div>
      </Link>

      <nav className="nav" aria-label="主导航">
        <Link href="/categories">分类</Link>
        <Link href="/#latest">精选</Link>
        <Link href="/#reading-log">收录日志</Link>
        <Link href="/#atelier">工作台</Link>
        <Link href="/#about">关于</Link>
      </nav>

      <div className={isHome ? "topbar-actions topbar-actions-home" : "topbar-actions"}>
        {!isHome ? (
          <Link className="topbar-console-link" href={adminAppUrl} rel="noreferrer" target="_blank">
            <span className="topbar-console-kicker">Control Room</span>
            <strong>管理后台</strong>
          </Link>
        ) : null}
        <Link
          aria-label={isHome ? "隐藏入口：进入管理后台" : "进入管理后台"}
          className="avatar-orbit topbar-orbit-link"
          href={adminAppUrl}
          rel="noreferrer"
          target="_blank"
        >
          <span className="avatar avatar-small" />
        </Link>
      </div>
    </header>
  );
}

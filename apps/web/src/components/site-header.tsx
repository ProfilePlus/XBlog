import Link from "next/link";
import { adminAppUrl } from "@/lib/site-links";

type SiteHeaderProps = {
  variant?: "default" | "secondary";
};

export async function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  void variant;

  return (
    <header className="site-header">
      <Link href="/" className="site-header-branding">
        <div className="vibe-seal-container" style={{ marginBottom: 0, marginRight: '1rem' }}>
          <img src="/images/logo.png" alt="Seal" style={{ width: '28px', height: '28px' }} />
        </div>
        <div>
          <h1>Alex Plum</h1>
          <p>Hefei / Java / K8s / Vibe Coding</p>
        </div>
      </Link>

      <nav className="site-header-nav" aria-label="主导航">
        <Link href="/categories">Categories</Link>
        <Link href="/search">Search</Link>
        <Link href="/#about">About</Link>
        <Link href={adminAppUrl} className="site-header-admin" rel="noreferrer" target="_blank">
          Admin
        </Link>
      </nav>
    </header>
  );
}

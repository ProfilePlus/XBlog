import Link from "next/link";
import { adminAppUrl } from "@/lib/site-links";

type SiteHeaderProps = {
  variant?: "default" | "secondary";
};

export async function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  void variant;

  return (
    <header className="site-header">
      <Link href="/">
        <div>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Alex Plum</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-dark-muted)", margin: 0 }}>
            合肥程序员 / Java / K8s / AI / 大模型 / Vibe Coding
          </p>
        </div>
      </Link>

      <nav aria-label="主导航">
        <Link href="/categories">分类</Link>
        <Link href="/search">搜索</Link>
        <Link href="/#about">关于</Link>
      </nav>

      <Link href={adminAppUrl} rel="noreferrer" target="_blank">
        管理后台
      </Link>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/admin",
    label: "情报汇总",
    eyebrow: "OVERVIEW",
  },
  {
    href: "/admin/articles",
    label: "档案记录",
    eyebrow: "STORIES",
  },
  {
    href: "/admin/categories",
    label: "领域分类",
    eyebrow: "TAXONOMY",
  },
  {
    href: "/admin/tokens",
    label: "进入令牌",
    eyebrow: "TOKENS",
  },
  {
    href: "/admin/storage",
    label: "核心存储",
    eyebrow: "STORAGE",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="后台主导航">
      {navItems.map((item, index) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-link ${active ? "is-active" : ""}`}
          >
            <div className="admin-nav-meta">
              <span className="admin-nav-index">/{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="admin-nav-copy">
              <strong>{item.label}</strong>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

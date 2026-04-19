"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "概览",
    eyebrow: "Overview",
    description: "先看文章、存储与令牌，让站点此刻的状态一眼明白。",
  },
  {
    href: "/articles",
    label: "文章",
    eyebrow: "Stories",
    description: "所有原创与收录都在这里翻页检视，发布、草稿与隐藏一目了然。",
  },
  {
    href: "/categories",
    label: "分类",
    eyebrow: "Taxonomy",
    description: "给每个主题补上标题、摘要、长说明与代表文章，让分区更有性格。",
  },
  {
    href: "/tokens",
    label: "令牌",
    eyebrow: "Tokens",
    description: "把写入令牌的生灭与使用痕迹收在一处，便于轮换，也便于回望。",
  },
  {
    href: "/storage",
    label: "存储",
    eyebrow: "Storage",
    description: "看清对象存储此刻是否通畅，上传、读取和探针结果都会落在这里。",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
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
              <span className="admin-nav-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="admin-nav-eyebrow">{item.eyebrow}</span>
            </div>
            <div className="admin-nav-copy">
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

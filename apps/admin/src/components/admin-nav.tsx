"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "概览",
    eyebrow: "Overview",
    description: "总览当前内容、刊期、存储与令牌状态。",
  },
  {
    href: "/editorial-desk",
    label: "编辑台",
    eyebrow: "Desk",
    description: "处理主稿、节奏和今日优先稿件。",
  },
  {
    href: "/articles",
    label: "文章",
    eyebrow: "Stories",
    description: "统一浏览全部内容实体和文章状态。",
  },
  {
    href: "/categories",
    label: "分类",
    eyebrow: "Taxonomy",
    description: "管理主题结构、摘要和首页落点语义。",
  },
  {
    href: "/category-cover-assets",
    label: "封面素材",
    eyebrow: "Cover Library",
    description: "分页管理分类封面素材、分配状态与 MinIO 入库。",
  },
  {
    href: "/home-issue",
    label: "刊期",
    eyebrow: "Issue",
    description: "控制首页主精选与两张侧卡的策展顺序。",
  },
  {
    href: "/tokens",
    label: "令牌",
    eyebrow: "Tokens",
    description: "管理机器接入、导入流程和轮换策略。",
  },
  {
    href: "/storage",
    label: "存储",
    eyebrow: "Storage",
    description: "检查 MinIO 上传、读取、诊断和上传探针。",
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

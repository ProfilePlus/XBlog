"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCategory } from "@xblog/contracts";
import { useAdminFeedback } from "@/components/admin/admin-feedback";
import { adminConfig } from "@/lib/config";

function createDraftCategoryPayload(index: number) {
  const suffix = crypto.randomUUID().slice(0, 6);

  return {
    slug: `category-${index + 1}-${suffix}`,
    name: "新分类",
    summary: "待补摘要",
    coverUrl: null,
    coverAssetId: null,
    tone: "aurora" as const,
    heroTitle: "待补分类 Hero 标题",
    curatorNote: "待补策展说明",
    longSummary: "待补长摘要",
    focusAreas: [],
    sortOrder: index,
    featuredArticleSlug: null,
  };
}

export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [items, setItems] = useState(categories);
  const [creating, setCreating] = useState(false);
  const { pushFeedback } = useAdminFeedback();

  async function createCategory() {
    setCreating(true);

    const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/categories`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createDraftCategoryPayload(items.length)),
    });

    if (!response.ok) {
      const failure = (await response.json().catch(() => null)) as { message?: string } | null;
      pushFeedback({
        tone: "error",
        title: "新建分类失败",
        description: failure?.message ?? "请稍后再试。",
      });
      setCreating(false);
      return;
    }

    const created = (await response.json()) as AdminCategory;
    setItems((current) => [created, ...current]);
    pushFeedback({
      tone: "success",
      title: "分类草稿已创建",
      description: "草稿已经落下，接着去独立编辑页把它慢慢写完整。",
    });
    setCreating(false);
    router.push(`/admin/categories/${created.id}`);
  }

  return (
    <div className="admin-category-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
        <div>
          <p className="admin-kicker">Taxonomy Management</p>
          <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', margin: 0 }}>分类体系</h2>
        </div>
        <button 
          className="admin-primary-button" 
          disabled={creating}
          onClick={() => void createCategory()}
        >
          {creating ? "正在建立..." : "新建分类节点"}
        </button>
      </div>

      <div className="admin-archive-list">
        {items.map((category) => (
          <div key={category.id} className="admin-item-row">
            <div className="admin-item-main">
              <div className="admin-item-title">{category.name}</div>
              <div className="admin-item-slug">/{category.slug}</div>
            </div>
            
            <div className="admin-item-meta">
              <span className="admin-chip" style={{ fontSize: '0.6rem' }}>{category.tone}</span>
            </div>

            <div className="admin-item-stats">
              <p className="admin-kicker" style={{ marginBottom: 0 }}>{category.articleCountLabel}</p>
            </div>

            <div className="admin-item-actions" style={{ textAlign: 'right' }}>
              <Link href={`/admin/categories/${category.id}`} className="admin-ghost-button">
                MANAGE
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCategory } from "@xblog/contracts";
import { useAdminFeedback } from "@/components/admin-feedback";
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
    router.push(`/categories/${created.id}`);
  }

  return (
    <div className="admin-grid">
      <section className="admin-card admin-library-panel">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Category Library</p>
            <h2>分类库</h2>
          </div>
          <span className="admin-chip">点开卡片继续细写</span>
        </div>
      </section>

      <button
        className="admin-card admin-link-card admin-create-rail"
        disabled={creating}
        onClick={() => void createCategory()}
        type="button"
      >
        <div className="admin-create-symbol" aria-hidden="true">
          +
        </div>
        <div className="admin-create-copy">
          <p className="admin-kicker">New Draft</p>
          <h2>{creating ? "正在创建分类..." : "创建分类草稿"}</h2>
        </div>
        <div className="admin-create-rail-side">
          <div className="admin-inline-actions">
            <span className="admin-chip">自动落下 slug</span>
            <span className="admin-chip">创建后直接入页</span>
          </div>
          <span className="admin-status-pill is-info">{creating ? "working" : "new"}</span>
        </div>
      </button>

      <div className="admin-category-grid">
        {items.map((category, index) => (
          <Link
            className="admin-card admin-category-card admin-link-card"
            href={`/categories/${category.id}`}
            key={category.id}
          >
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Category {String(index + 1).padStart(2, "0")}</p>
                <h2>{category.name}</h2>
              </div>
              <span className="admin-status-pill is-info">{category.tone}</span>
            </div>

            <p className="admin-subtle admin-category-summary">{category.summary}</p>

            <div className="admin-inline-actions">
              <span className="admin-chip">{category.articleCountLabel}</span>
              <span className="admin-chip">/{category.slug}</span>
            </div>

            {category.focusAreas.length > 0 ? (
              <div className="admin-focus-list">
                {category.focusAreas.map((item) => (
                  <span className="admin-chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="admin-category-footer">
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

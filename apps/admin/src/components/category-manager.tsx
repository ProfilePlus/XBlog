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
    <div className="admin-category-stack">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button 
          className="admin-primary-button" 
          disabled={creating}
          onClick={() => void createCategory()}
        >
          {creating ? "Creating..." : "New Category"}
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', background: '#f9fafb' }}>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Slug / Tone</th>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Articles</th>
              <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((category) => (
              <tr key={category.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '4px', 
                      background: '#f4f4f5',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem'
                    }}>
                      {category.coverUrl ? (
                        <img src={category.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      ) : '📂'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{category.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {category.summary}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>/{category.slug}</div>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    textTransform: 'uppercase', 
                    fontWeight: 700, 
                    color: '#6366f1',
                    background: '#eef2ff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginTop: '4px',
                    display: 'inline-block'
                  }}>
                    {category.tone}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{category.articleCountLabel}</span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <Link href={`/categories/${category.id}`} style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'underline' }}>
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCategory, CategoryCoverAssetSummary } from "@xblog/contracts";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { useAdminFeedback } from "@/components/admin-feedback";
import { AdminStepperInput } from "@/components/admin-stepper-input";
import { categoryCoverPresets } from "@/lib/category-cover-presets";
import { adminConfig } from "@/lib/config";

type CategoryEditorProps = {
  category: AdminCategory;
  coverAssets: CategoryCoverAssetSummary[];
};

export function CategoryEditor({ category, coverAssets }: CategoryEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState(category);
  const [coverAssetsState, setCoverAssetsState] = useState(coverAssets);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [assetPending, setAssetPending] = useState(false);
  const [coverImportUrl, setCoverImportUrl] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pushFeedback } = useAdminFeedback();
  const selectedCoverAsset =
    coverAssetsState.find((asset) => asset.id === form.coverAssetId) ?? null;
  const previewCoverUrl = selectedCoverAsset?.url ?? form.coverUrl;
  const selectableAssets = coverAssetsState.filter(
    (asset) => !asset.isAssigned || asset.assignedCategoryId === form.id,
  );

  const payload = {
    slug: form.slug,
    name: form.name,
    summary: form.summary,
    coverUrl: form.coverUrl,
    coverAssetId: form.coverAssetId,
    tone: form.tone,
    heroTitle: form.heroTitle,
    curatorNote: form.curatorNote,
    focusAreas: form.focusAreas,
    featuredArticleSlug: form.featuredArticleSlug,
    sortOrder: form.sortOrder,
    longSummary: form.longSummary,
  };

  async function promoteCategoryCoverAsset(assetId: string, tone: AdminCategory["tone"], label: string | null) {
    const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/category-cover-assets`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assetId,
        tone,
        label,
      }),
    });

    if (!response.ok) {
      const failure = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(failure?.message ?? "素材登记失败");
    }

    return (await response.json()) as CategoryCoverAssetSummary;
  }

  async function uploadCoverAsset(file: File) {
    setAssetPending(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const upload = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/assets/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!upload.ok) {
        throw new Error("上传素材失败");
      }

      const uploaded = (await upload.json()) as { id: string; url: string };
      const asset = await promoteCategoryCoverAsset(uploaded.id, form.tone, form.name || file.name);
      setCoverAssetsState((current) => [
        asset,
        ...current.filter((entry) => entry.id !== asset.id),
      ]);
      setForm((current) => ({
        ...current,
        coverAssetId: asset.id,
        coverUrl: null,
      }));
      pushFeedback({
        tone: "success",
        title: "分类封面已上传",
        description: "这张图已经收进素材库，也已经挂到当前分类名下。",
      });
    } catch (error) {
      pushFeedback({
        tone: "error",
        title: "分类封面上传失败",
        description: error instanceof Error ? error.message : "这张图还没能带回来，稍后再试一次。",
      });
    } finally {
      setAssetPending(false);
    }
  }

  async function importCoverAsset() {
    if (!coverImportUrl.trim()) {
      pushFeedback({
        tone: "error",
        title: "缺少远程图片地址",
        description: "先贴上一张能访问到的图片地址，再把它带回来。",
      });
      return;
    }

    setAssetPending(true);

    try {
      const importResponse = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/assets/import`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceUrl: coverImportUrl.trim() }),
      });

      if (!importResponse.ok) {
        throw new Error("远程素材导入失败");
      }

      const imported = (await importResponse.json()) as { id: string; url: string };
      const asset = await promoteCategoryCoverAsset(imported.id, form.tone, form.name || "分类封面");
      setCoverAssetsState((current) => [
        asset,
        ...current.filter((entry) => entry.id !== asset.id),
      ]);
      setForm((current) => ({
        ...current,
        coverAssetId: asset.id,
        coverUrl: null,
      }));
      setCoverImportUrl("");
      pushFeedback({
        tone: "success",
        title: "远程素材已导入",
        description: "那张远程图片已经被收进素材库，也已经挂到当前分类名下。",
      });
    } catch (error) {
      pushFeedback({
        tone: "error",
        title: "远程素材导入失败",
        description: error instanceof Error ? error.message : "那张图暂时还没能从远处取回，稍后再试一次。",
      });
    } finally {
      setAssetPending(false);
    }
  }

  async function saveCategory() {
    if (pending || deletePending) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/categories/${form.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "保存分类失败",
          description: failure?.message ?? "这个分类还没能写稳，稍后再试一次。",
        });
        return;
      }

      const saved = (await response.json()) as AdminCategory;
      setForm(saved);
      setCoverAssetsState((current) =>
        current.map((asset) => ({
          ...asset,
          isAssigned: asset.id === saved.coverAssetId || (asset.isAssigned && asset.assignedCategoryId !== saved.id),
          assignedCategoryId: asset.id === saved.coverAssetId ? saved.id : asset.assignedCategoryId === saved.id ? null : asset.assignedCategoryId,
          assignedCategoryName: asset.id === saved.coverAssetId ? saved.name : asset.assignedCategoryId === saved.id ? null : asset.assignedCategoryName,
          assignedCategorySlug: asset.id === saved.coverAssetId ? saved.slug : asset.assignedCategoryId === saved.id ? null : asset.assignedCategorySlug,
        })),
      );
      pushFeedback({
        tone: "success",
        title: "分类已保存",
        description: "这个分类的名字、摘要和策展信息都已经写回内容库。",
      });
    } catch {
      pushFeedback({
        tone: "error",
        title: "保存分类失败",
        description: "这次保存在路上断开了，再试一次就好。",
      });
    } finally {
      setPending(false);
    }
  }

  async function deleteCategory() {
    if (pending || deletePending) {
      return;
    }

    setDeletePending(true);

    try {
      const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/categories/${form.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "删除分类失败",
          description: failure?.message ?? "这个分类下面还牵着文章，先把关联理顺再收走它。",
        });
        return;
      }

      pushFeedback({
        tone: "success",
        title: "分类已删除",
        description: "这个分类已经从分类库里退场。",
      });
      router.push("/categories");
      router.refresh();
    } catch {
      pushFeedback({
        tone: "error",
        title: "删除分类失败",
        description: "删除动作在路上断开了，再试一次就好。",
      });
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="admin-grid">
      <AdminConfirmDialog
        cancelLabel="保留分类"
        confirmLabel="删除分类"
        description="删掉之后，这个分类会立刻从分类库退场；如果它下面还挂着文章，系统会先把你拦下来。"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void deleteCategory();
        }}
        open={confirmOpen}
        pending={deletePending}
        title="要把这个分类从分类库里收走吗？"
        tone="danger"
      />
      <section className="admin-card admin-editor-toolbar admin-editor-hero">
        <div className="admin-editor-hero-copy">
          <div className="admin-masthead-badge-row">
            <p className="admin-kicker">Category Editor</p>
            <span className="admin-chip">/{form.slug || "draft-category"}</span>
          </div>
          <h1>{form.name || "未命名分类"}</h1>
          <p className="admin-subtle">
            在这里替一个分类定名字、写摘要、挑封面，也替它安放在首页上的语气。
          </p>
        </div>
        <div className="admin-inline-actions admin-editor-toolbar-actions">
          <Link className="admin-ghost-button" href="/categories">
            返回分类库
          </Link>
          <button className="admin-primary-button" disabled={pending || deletePending} onClick={() => void saveCategory()} type="button">
            {pending ? "保存中..." : "保存分类"}
          </button>
          <button className="admin-danger-button" disabled={pending || deletePending} onClick={() => setConfirmOpen(true)} type="button">
            {deletePending ? "删除中..." : "删除分类"}
          </button>
        </div>
        <div className="admin-hero-meta">
          <span className="admin-chip">/{form.slug || "draft-category"}</span>
          <span className="admin-chip">{form.articleCountLabel}</span>
          <span className="admin-chip">排序 {form.sortOrder}</span>
        </div>
      </section>

      <div className="admin-editor-workbench">
        <div className="admin-editor-column">
          <section className="admin-card admin-section-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Primary Meta</p>
                <h2>基础信息</h2>
              </div>
            </div>

            <div className="admin-form">
              <div className="admin-form-grid">
                <label>
                  分类名称
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label>
                  Slug
                  <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
                </label>
                <label>
                  色调
                  <select
                    value={form.tone}
                    onChange={(event) =>
                      setForm({ ...form, tone: event.target.value as AdminCategory["tone"] })
                    }
                  >
                    <option value="aurora">Aurora</option>
                    <option value="pink">Pink</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                  </select>
                </label>
                <AdminStepperInput
                  label="排序"
                  value={form.sortOrder}
                  onChange={(value) => setForm({ ...form, sortOrder: value })}
                />
                <label>
                  代表文章 Slug
                  <input
                    value={form.featuredArticleSlug ?? ""}
                    onChange={(event) =>
                      setForm({ ...form, featuredArticleSlug: event.target.value || null })
                    }
                  />
                </label>
              </div>

              <div className="admin-inline-actions">
                <span className="admin-chip">{form.articleCountLabel}</span>
                <span className="admin-chip">/{form.slug || "draft-category"}</span>
                <span className="admin-chip">排序 {form.sortOrder}</span>
              </div>

              <label>
                Hero 标题
                <input
                  value={form.heroTitle}
                  onChange={(event) => setForm({ ...form, heroTitle: event.target.value })}
                />
              </label>

              <label>
                短摘要
                <textarea
                  value={form.summary}
                  onChange={(event) => setForm({ ...form, summary: event.target.value })}
                />
              </label>

              <label>
                长摘要
                <textarea
                  className="admin-textarea-large"
                  value={form.longSummary}
                  onChange={(event) => setForm({ ...form, longSummary: event.target.value })}
                />
              </label>

              <label>
                从素材库选择封面
                <select
                  value={form.coverAssetId ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      coverAssetId: event.target.value || null,
                      coverUrl: event.target.value ? null : form.coverUrl,
                    })
                  }
                >
                  <option value="">不指定，按 slug 和色调自动匹配</option>
                  {selectableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {(asset.label ?? "未命名素材") + " / " + (asset.tone ?? "未标记")}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-inline-actions">
                <label className="admin-upload-button">
                  {assetPending ? "上传中..." : "上传并设为封面"}
                  <input
                    accept="image/*"
                    disabled={assetPending}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadCoverAsset(file);
                      }
                      event.currentTarget.value = "";
                    }}
                    type="file"
                  />
                </label>
                <Link className="admin-ghost-button" href="/category-cover-assets">
                  打开素材库
                </Link>
              </div>

              <label>
                远程图片导入到素材库
                <div className="admin-inline-field">
                  <input
                    disabled={assetPending}
                    placeholder="https://example.com/aurora.jpg"
                    value={coverImportUrl}
                    onChange={(event) => setCoverImportUrl(event.target.value)}
                  />
                  <button className="admin-primary-button" disabled={assetPending} onClick={() => void importCoverAsset()} type="button">
                    导入
                  </button>
                </div>
              </label>

              <label>
                高级覆盖路径
                <input
                  list="category-cover-presets"
                  placeholder="/images/category-covers/library/aurora-01-frontier.jpg"
                  value={form.coverUrl ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      coverUrl: event.target.value.trim() || null,
                      coverAssetId: event.target.value.trim() ? null : form.coverAssetId,
                    })
                  }
                />
                <datalist id="category-cover-presets">
                  {categoryCoverPresets.map((preset) => (
                    <option key={preset} value={preset} />
                  ))}
                </datalist>
              </label>
            </div>
          </section>
        </div>

        <div className="admin-editor-inspector">
          <section className="admin-card admin-section-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Editorial Framing</p>
                <h2>策展信息</h2>
              </div>
            </div>

            <div className="admin-form">
              <label>
                Focus Areas
                <textarea
                  value={form.focusAreas.join("\n")}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      focusAreas: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>

              <label>
                策展注释
                <textarea
                  className="admin-textarea-large"
                  value={form.curatorNote}
                  onChange={(event) => setForm({ ...form, curatorNote: event.target.value })}
                />
              </label>

              <ul className="admin-note-list">
                <li>文章数量会根据当前分类挂载的文章自动计算，不需要手动维护。</li>
                <li>Hero 标题、短摘要和 Focus Areas 会先出现在首页分类卡片，再落到分类详情页里。</li>
                <li>手动选中的素材会一直跟着这个分类；不指定时，系统才会替它去认领一张图。</li>
                <li>如果暂时没有可用素材，这个分类会先用渐变占位，不让首页留下空白。</li>
              </ul>
            </div>
          </section>

          <section className="admin-card admin-section-card admin-preview-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Preview</p>
                <h2>分类卡片预览</h2>
              </div>
            </div>

            <div className="admin-preview-surface">
              {previewCoverUrl ? (
                <Image
                  alt={`${form.name || "分类"} 封面预览`}
                  height={160}
                  src={previewCoverUrl}
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "cover",
                    borderRadius: "18px",
                    marginBottom: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                  unoptimized
                  width={960}
                />
              ) : null}
              <div className="admin-inline-actions">
                <span className="admin-status-pill is-info">{form.tone}</span>
                <span className="admin-chip">{form.articleCountLabel}</span>
                <span className="admin-chip">
                  {form.coverAssetId ? "手动素材" : form.coverUrl ? "路径覆盖" : "自动匹配"}
                </span>
              </div>
              <h3>{form.name || "未命名分类"}</h3>
              <p className="admin-subtle">{form.summary}</p>
              <div className="admin-focus-list">
                {form.focusAreas.length > 0 ? (
                  form.focusAreas.map((item) => (
                    <span className="admin-chip" key={item}>
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="admin-chip">还没有 focus area</span>
                )}
              </div>
              <p className="admin-subtle">{form.heroTitle}</p>
              <p className="admin-subtle">{form.curatorNote}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type AdminArticle,
  type ArticleBlock,
  type CategorySummary,
  upsertArticleRequestSchema,
} from "@xblog/contracts";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { useAdminFeedback } from "@/components/admin-feedback";
import { adminConfig } from "@/lib/config";

type EditableArticle = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  lede: string;
  kind: "ORIGINAL" | "CURATED";
  tone: "pink" | "blue" | "green" | "aurora";
  categoryId: string;
  readingTime: string;
  authorDisplayName: string;
  authorRoleLabel: string;
  highlights: string[];
  blocks: ArticleBlock[];
  coverAssetId: string | null;
  coverUrl: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceAuthor: string | null;
  sourcePublishedAt: string | null;
};

function emptyBlock(type: ArticleBlock["type"]): ArticleBlock {
  switch (type) {
    case "heading":
      return { id: crypto.randomUUID(), type: "heading", level: 2, text: "" };
    case "paragraph":
      return { id: crypto.randomUUID(), type: "paragraph", text: "" };
    case "image":
      return { id: crypto.randomUUID(), type: "image", url: "", alt: "", caption: "" };
    case "quote":
      return { id: crypto.randomUUID(), type: "quote", text: "", citation: "" };
    case "list":
      return { id: crypto.randomUUID(), type: "list", style: "bullet", items: [""] };
    case "code":
      return { id: crypto.randomUUID(), type: "code", language: "text", code: "" };
    case "divider":
      return { id: crypto.randomUUID(), type: "divider" };
  }
}

function toEditable(article: AdminArticle | undefined, categories: CategorySummary[]): EditableArticle {
  if (!article) {
    return {
      slug: "",
      title: "",
      excerpt: "",
      lede: "",
      kind: "ORIGINAL",
      tone: "aurora",
      categoryId: categories[0]?.id ?? "",
      readingTime: "6 分钟",
      authorDisplayName: "Lin",
      authorRoleLabel: "Editor",
      highlights: [],
      blocks: [{ id: crypto.randomUUID(), type: "paragraph", text: "" }],
      coverAssetId: null,
      coverUrl: null,
      sourceUrl: null,
      sourceTitle: null,
      sourceAuthor: null,
      sourcePublishedAt: null,
    };
  }

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    lede: article.lede,
    kind: article.kind,
    tone: article.tone,
    categoryId: article.categoryId,
    readingTime: article.readingTime,
    authorDisplayName: article.authorDisplayName,
    authorRoleLabel: article.authorRoleLabel,
    highlights: article.highlights,
    blocks: article.blocks,
    coverAssetId: article.coverAssetId,
    coverUrl: article.coverUrl,
    sourceUrl: article.sourceUrl,
    sourceTitle: article.sourceTitle,
    sourceAuthor: article.sourceAuthor,
    sourcePublishedAt: article.sourcePublishedAt,
  };
}

function formatIssues(messages: string[]) {
  return Array.from(new Set(messages.filter(Boolean))).join("；");
}

function statusTone(status: AdminArticle["status"]) {
  if (status === "PUBLISHED") {
    return "is-ok";
  }

  if (status === "HIDDEN") {
    return "is-error";
  }

  return "is-warn";
}

function statusLabel(status: AdminArticle["status"]) {
  if (status === "PUBLISHED") {
    return "已发布";
  }

  if (status === "HIDDEN") {
    return "已隐藏";
  }

  return "草稿";
}

function kindLabel(kind: EditableArticle["kind"]) {
  return kind === "ORIGINAL" ? "原创写作" : "收录整理";
}

function blockTypeLabel(type: ArticleBlock["type"]) {
  if (type === "heading") {
    return "标题";
  }

  if (type === "paragraph") {
    return "段落";
  }

  if (type === "image") {
    return "图片";
  }

  if (type === "quote") {
    return "引用";
  }

  if (type === "list") {
    return "列表";
  }

  if (type === "code") {
    return "代码";
  }

  return "分割线";
}

function blockHasMeaningfulContent(block: ArticleBlock) {
  if (block.type === "divider") {
    return true;
  }

  if (block.type === "heading") {
    return Boolean(block.text.trim());
  }

  if (block.type === "paragraph") {
    return Boolean(block.text.trim());
  }

  if (block.type === "image") {
    return Boolean(block.url.trim());
  }

  if (block.type === "quote") {
    return Boolean(block.text.trim() || block.citation.trim());
  }

  if (block.type === "list") {
    return block.items.some((item) => item.trim().length > 0);
  }

  return Boolean(block.code.trim());
}

export function ArticleEditor({
  article,
  categories,
}: {
  article?: AdminArticle;
  categories: CategorySummary[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<EditableArticle>(() => toEditable(article, categories));
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [assetPending, setAssetPending] = useState(false);
  const [coverImportUrl, setCoverImportUrl] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pushFeedback } = useAdminFeedback();
  const currentStatus = article?.status ?? "DRAFT";
  const publishedAtLabel = article?.publishedAt ?? "尚未发布";
  const metadataReadyCount = [
    form.title.trim(),
    form.slug.trim(),
    form.excerpt.trim(),
    form.lede.trim(),
    form.readingTime.trim(),
    form.categoryId,
    form.authorDisplayName.trim(),
    form.authorRoleLabel.trim(),
  ].filter(Boolean).length;
  const contentReadyCount = form.blocks.filter(blockHasMeaningfulContent).length;
  const sourceReadyCount = [
    form.sourceUrl?.trim() ?? "",
    form.sourceTitle?.trim() ?? "",
    form.sourceAuthor?.trim() ?? "",
    form.sourcePublishedAt?.trim() ?? "",
  ].filter(Boolean).length;
  const highlightCount = form.highlights.map((item) => item.trim()).filter(Boolean).length;

  const payload = useMemo(
    () => ({
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      lede: form.lede.trim(),
      kind: form.kind,
      tone: form.tone,
      categoryId: form.categoryId,
      readingTime: form.readingTime.trim(),
      authorDisplayName: form.authorDisplayName.trim(),
      authorRoleLabel: form.authorRoleLabel.trim(),
      highlights: form.highlights.map((item) => item.trim()).filter(Boolean),
      blocks: form.blocks,
      coverAssetId: form.coverAssetId,
      sourceUrl: form.sourceUrl?.trim() ? form.sourceUrl.trim() : null,
      sourceTitle: form.sourceTitle?.trim() ? form.sourceTitle.trim() : null,
      sourceAuthor: form.sourceAuthor?.trim() ? form.sourceAuthor.trim() : null,
      sourcePublishedAt: form.sourcePublishedAt?.trim() ? form.sourcePublishedAt.trim() : null,
    }),
    [form],
  );

  async function uploadCover(file: File) {
    setAssetPending(true);

    const prepare = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/assets/presign`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      }),
    });

    if (!prepare.ok) {
      pushFeedback({
        tone: "error",
        title: "封面上传失败",
        description: "封面的预签名还没申请下来，再试一次就好。",
      });
      setAssetPending(false);
      return;
    }

    const prepared = await prepare.json();
    const uploadResponse = await fetch(prepared.upload.url, {
      method: prepared.upload.method,
      headers: prepared.upload.headers,
      body: file,
    });

    if (!uploadResponse.ok) {
      pushFeedback({
        tone: "error",
        title: "封面上传失败",
        description: "这张图还没被对象存储收下，再试一次就好。",
      });
      setAssetPending(false);
      return;
    }

    const finalize = await fetch(prepared.upload.completeUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ token: prepared.upload.token }),
    });

    if (!finalize.ok) {
      pushFeedback({
        tone: "error",
        title: "资产登记失败",
        description: "图片已经送到了存储里，但后台还没替它把名字落进资产库。",
      });
      setAssetPending(false);
      return;
    }

    const asset = await finalize.json();
    setForm((current) => ({
      ...current,
      coverAssetId: asset.id,
      coverUrl: asset.url,
    }));
    pushFeedback({
      tone: "success",
      title: "封面已上传",
      description: "封面已经收进对象存储，也已经安到这篇文章上。",
    });
    setAssetPending(false);
  }

  async function importCoverFromUrl() {
    if (!coverImportUrl) {
      pushFeedback({
        tone: "error",
        title: "缺少远程图片地址",
        description: "先贴上一张能访问到的图片地址，再把它带回来。",
      });
      return;
    }

    setAssetPending(true);

    const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/assets/import`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ sourceUrl: coverImportUrl }),
    });

    if (!response.ok) {
      pushFeedback({
        tone: "error",
        title: "远程封面导入失败",
        description: "那张图暂时还没能从远处取回，检查一下地址，或者稍后再试。",
      });
      setAssetPending(false);
      return;
    }

    const asset = await response.json();
    setForm((current) => ({
      ...current,
      coverAssetId: asset.id,
      coverUrl: asset.url,
    }));
    setCoverImportUrl("");
    pushFeedback({
      tone: "success",
      title: "封面已导入",
      description: "远程图片已经被带回站里，也已经挂到这篇文章上。",
    });
    setAssetPending(false);
  }

  async function saveArticle(method: "POST" | "PUT") {
    if (pending || deletePending) {
      return;
    }

    setPending(true);

    try {
      const parsed = upsertArticleRequestSchema.safeParse(payload);
      if (!parsed.success) {
        pushFeedback({
          tone: "error",
          title: "文章内容还不完整",
          description: formatIssues(parsed.error.issues.map((issue) => issue.message)),
          ttlMs: 7600,
        });
        return;
      }

      const url = form.id
        ? `${adminConfig.apiBaseUrl}/v1/admin/articles/${form.id}`
        : `${adminConfig.apiBaseUrl}/v1/admin/articles`;

      const response = await fetch(url, {
        method,
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "保存文章失败",
          description: failure?.message ?? "这篇文章还没能落稳，看看是不是还有字段没有写完。",
          ttlMs: 7600,
        });
        return;
      }

      const saved = (await response.json()) as AdminArticle;
      pushFeedback({
        tone: "success",
        title: "文章已保存",
        description: form.id ? "这次改动已经写回内容库。" : "草稿已经落下，正带你走进编辑页。",
      });
      if (!form.id) {
        router.push(`/articles/${saved.id}`);
      } else {
        setForm(toEditable(saved, categories));
      }
    } catch {
      pushFeedback({
        tone: "error",
        title: "保存文章失败",
        description: "这次保存在路上断开了，再试一次就好。",
      });
    } finally {
      setPending(false);
    }
  }

  async function updateStatus(action: "publish" | "hide") {
    if (!form.id) {
      return;
    }

    const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/articles/${form.id}/${action}`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      pushFeedback({
        tone: "error",
        title: action === "publish" ? "发布失败" : "隐藏失败",
        description: action === "publish" ? "这篇文章还没能走到公开站前台。" : "这篇文章暂时还没能退回幕后。",
      });
      return;
    }

    pushFeedback({
      tone: "success",
      title: action === "publish" ? "文章已发布" : "文章已隐藏",
      description: action === "publish" ? "它已经走到公开站前台，读者现在能看见它。" : "它已经从公开站退回幕后，读者暂时不会再看见它。",
    });
    router.refresh();
  }

  async function deleteArticle() {
    if (!form.id || pending || deletePending) {
      return;
    }

    setDeletePending(true);

    try {
      const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/articles/${form.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "删除文章失败",
          description: failure?.message ?? "这篇文章暂时还牵着别处，先把首页策展或关联状态理顺。",
          ttlMs: 7600,
        });
        return;
      }

      pushFeedback({
        tone: "success",
        title: "文章已删除",
        description: "这篇文章已经从内容库退场。",
      });
      router.push("/articles");
      router.refresh();
    } catch {
      pushFeedback({
        tone: "error",
        title: "删除文章失败",
        description: "删除动作在路上断开了，再试一次就好。",
      });
    } finally {
      setDeletePending(false);
    }
  }

  function updateBlock(index: number, next: ArticleBlock) {
    setForm((current) => ({
      ...current,
      blocks: current.blocks.map((block, blockIndex) => (blockIndex === index ? next : block)),
    }));
  }

  return (
    <div className="admin-editor-stack">
      <AdminConfirmDialog
        cancelLabel="保留文章"
        confirmLabel="删除文章"
        description="删掉之后，这篇文章会立刻从内容库退场；如果首页这一期还在用它，系统会先把你拦下来。"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void deleteArticle();
        }}
        open={confirmOpen}
        pending={deletePending}
        title="要把这篇文章从内容库里收走吗？"
        tone="danger"
      />
      <section className="admin-card admin-editor-toolbar admin-editor-hero">
        <div className="admin-editor-hero-copy">
          <div className="admin-masthead-badge-row">
            <p className="admin-kicker">{form.id ? "Story Editor" : "New Story"}</p>
            <span className="admin-chip">{form.id ? `/${form.slug || "draft-story"}` : "草稿工作区"}</span>
          </div>
          <h1>{form.title.trim() || "未命名文章"}</h1>
        </div>
        <div className="admin-inline-actions admin-editor-toolbar-actions">
          <button className="admin-primary-button" disabled={pending || deletePending} onClick={() => saveArticle(form.id ? "PUT" : "POST")} type="button">
            {pending ? "保存中..." : "保存文章"}
          </button>
          {form.id ? (
            <>
              <button className="admin-ghost-button" disabled={pending || deletePending} onClick={() => updateStatus("publish")} type="button">
                发布
              </button>
              <button className="admin-ghost-button" disabled={pending || deletePending} onClick={() => updateStatus("hide")} type="button">
                隐藏
              </button>
              <button className="admin-danger-button" disabled={deletePending || pending} onClick={() => setConfirmOpen(true)} type="button">
                {deletePending ? "删除中..." : "删除文章"}
              </button>
            </>
          ) : null}
        </div>
        <div className="admin-hero-meta">
          <span className={`admin-status-pill ${statusTone(currentStatus)}`}>{statusLabel(currentStatus)}</span>
          <span className="admin-chip">{kindLabel(form.kind)}</span>
          <span className="admin-chip">{form.blocks.length} 个内容块</span>
          <span className="admin-chip">{form.coverUrl ? "封面已就绪" : "未设置封面"}</span>
          <span className="admin-chip">发布时间 {publishedAtLabel}</span>
        </div>
      </section>
      <section className="admin-editor-overview">
        <article className="admin-card admin-editor-overview-card">
          <p className="admin-kicker">Editorial Pulse</p>
          <strong>{metadataReadyCount}/8</strong>
          <span className="admin-status-pill is-info">Metadata</span>
        </article>
        <article className="admin-card admin-editor-overview-card">
          <p className="admin-kicker">Story Body</p>
          <strong>{contentReadyCount}/{form.blocks.length || 1}</strong>
          <span className="admin-status-pill is-info">Canvas</span>
        </article>
        <article className="admin-card admin-editor-overview-card">
          <p className="admin-kicker">Cover Readiness</p>
          <strong>{form.coverUrl ? "Ready" : "Missing"}</strong>
          <span className={`admin-status-pill ${form.coverUrl ? "is-ok" : "is-warn"}`}>{form.coverUrl ? "封面已绑定" : "等待封面"}</span>
        </article>
        <article className="admin-card admin-editor-overview-card">
          <p className="admin-kicker">Highlights & Source</p>
          <strong>{highlightCount} / {form.kind === "CURATED" ? `${sourceReadyCount}/4` : "Optional"}</strong>
          <span className="admin-status-pill is-info">{form.kind === "CURATED" ? "Source-led" : "Original-led"}</span>
        </article>
      </section>
      <div className="admin-editor-workbench">
        <div className="admin-editor-stage">
          <section className="admin-card admin-section-card admin-editor-primary-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Story Copy</p>
                <h2>基础信息</h2>
                <h2>正文编辑器</h2>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="admin-editor-inspector">
          <section className="admin-card admin-section-card admin-preview-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Reader Preview</p>
                <h2>首页卡片预览</h2>
              </div>
            </div>

            <div className="admin-story-preview">
              <div className="admin-story-preview-cover">
                {form.coverUrl ? (
                  <Image
                    alt={form.title || "故事预览封面"}
                    height={320}
                    src={form.coverUrl}
                    unoptimized
                    width={640}
                  />
                ) : (
                  <div className="admin-story-preview-fallback">
                    <span className="admin-status-pill is-info">{form.tone}</span>
                  </div>
                )}
              </div>

              <div className="admin-story-preview-copy">
                <div className="admin-inline-actions">
                  <span className={`admin-status-pill ${statusTone(currentStatus)}`}>{statusLabel(currentStatus)}</span>
                  <span className="admin-chip">{kindLabel(form.kind)}</span>
                </div>
                <h3>{form.title.trim() || "未命名文章"}</h3>
                <div className="admin-inline-actions">
                  <span className="admin-chip">
                    {categories.find((category) => category.id === form.categoryId)?.name ?? "未选分类"}
                  </span>
                  <span className="admin-chip">{form.readingTime}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-card admin-section-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Cover Asset</p>
                <h2>封面图片</h2>
              </div>
              {form.coverUrl ? (
                <button
                  className="admin-ghost-button"
                  onClick={() => setForm((current) => ({ ...current, coverAssetId: null, coverUrl: null }))}
                  type="button"
                >
                  移除封面
                </button>
              ) : null}
            </div>

            <div className="admin-asset-grid">
              {form.coverUrl ? (
                <div className="admin-asset-preview">
                  <Image
                    alt={form.title || "封面预览"}
                    height={560}
                    src={form.coverUrl}
                    unoptimized
                    width={960}
                  />
                </div>
              ) : (
                <div className="admin-asset-empty">
                  <h3>上传本地图片</h3>
                  <h3>导入远程封面</h3>
                <h2>发布与元信息</h2>
              </div>
            </div>
            <div className="admin-form">
              <div className="admin-form-grid">
                <label>
                  类型
                  <select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as EditableArticle["kind"] })}>
                    <option value="ORIGINAL">原创写作</option>
                    <option value="CURATED">收录整理</option>
                  </select>
                </label>
                <label>
                  色调
                  <select value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value as EditableArticle["tone"] })}>
                    <option value="aurora">Aurora</option>
                    <option value="pink">Pink</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                  </select>
                </label>
                <label>
                  分类
                  <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                    <option value="">请选择</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  作者显示名
                  <input value={form.authorDisplayName} onChange={(event) => setForm({ ...form, authorDisplayName: event.target.value })} />
                </label>
                <label>
                  作者角色
                  <input value={form.authorRoleLabel} onChange={(event) => setForm({ ...form, authorRoleLabel: event.target.value })} />
                </label>
              </div>
            </div>
          </section>

          <section className="admin-card admin-section-card">
            <div className="admin-section-head">
              <div>
                <p className="admin-kicker">Highlights & Source</p>
                <h2>摘要与来源</h2>
              </div>
            </div>
            <div className="admin-form">
              <label>
                Highlights
                <textarea
                  className="admin-textarea-large"
                  value={form.highlights.join("\n")}
                  onChange={(event) => setForm({ ...form, highlights: event.target.value.split("\n") })}
                />
              </label>
              <label>
                来源 URL
                <input value={form.sourceUrl ?? ""} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value || null })} />
              </label>
              <label>
                来源标题
                <input value={form.sourceTitle ?? ""} onChange={(event) => setForm({ ...form, sourceTitle: event.target.value || null })} />
              </label>
              <label>
                来源作者
                <input value={form.sourceAuthor ?? ""} onChange={(event) => setForm({ ...form, sourceAuthor: event.target.value || null })} />
              </label>
              <label>
                来源发布时间
                <input
                  placeholder="2026-03-15"
                  value={form.sourcePublishedAt ?? ""}
                  onChange={(event) => setForm({ ...form, sourcePublishedAt: event.target.value || null })}
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

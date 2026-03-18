"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  CategoryCoverAssetAssignmentFilter,
  CategoryCoverAssetListResponse,
  CategoryCoverAssetSummary,
  CategoryTone,
} from "@xblog/contracts";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { useAdminFeedback } from "@/components/admin-feedback";
import { adminConfig } from "@/lib/config";

const toneOptions: Array<{ value: CategoryTone; label: string }> = [
  { value: "aurora", label: "Aurora" },
  { value: "pink", label: "Pink" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
];

const filterToneOptions: Array<{ value: CategoryTone | "all"; label: string }> = [
  { value: "all", label: "全部色调" },
  ...toneOptions,
];

const assignmentOptions: Array<{ value: CategoryCoverAssetAssignmentFilter; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "unassigned", label: "未占用" },
  { value: "assigned", label: "已占用" },
];

type AssetFilters = {
  tone: CategoryTone | "all";
  assignment: CategoryCoverAssetAssignmentFilter;
};

function formatDimensions(asset: CategoryCoverAssetSummary) {
  if (!asset.width || !asset.height) {
    return "尺寸待识别";
  }

  return `${asset.width} x ${asset.height}`;
}

function formatErrorMessage(fallback: string, message?: string) {
  return message?.trim() || fallback;
}

export function CategoryCoverAssetManager({
  initialResponse,
}: {
  initialResponse: CategoryCoverAssetListResponse;
}) {
  const [assets, setAssets] = useState(initialResponse.items);
  const [page, setPage] = useState(initialResponse.page);
  const [total, setTotal] = useState(initialResponse.total);
  const [pageSize] = useState(initialResponse.pageSize);
  const [intakeTone, setIntakeTone] = useState<CategoryTone>("aurora");
  const [filters, setFilters] = useState<AssetFilters>({
    tone: "all",
    assignment: "all",
  });
  const [label, setLabel] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [pagePending, setPagePending] = useState(false);
  const [assetPending, setAssetPending] = useState(false);
  const [assetTaskLabel, setAssetTaskLabel] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [confirmAsset, setConfirmAsset] = useState<CategoryCoverAssetSummary | null>(null);
  const { pushFeedback } = useAdminFeedback();
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(Math.max(total, 1) / pageSize)),
    [pageSize, total],
  );

  function buildListUrl(nextPage: number, nextFilters: AssetFilters) {
    const search = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(pageSize),
    });

    if (nextFilters.tone !== "all") {
      search.set("tone", nextFilters.tone);
    }

    if (nextFilters.assignment !== "all") {
      search.set("assignment", nextFilters.assignment);
    }

    return `${adminConfig.apiBaseUrl}/v1/admin/category-cover-assets?${search.toString()}`;
  }

  async function loadPage(nextPage: number, nextFilters: AssetFilters = filters) {
    setPagePending(true);

    try {
      const response = await fetch(buildListUrl(nextPage, nextFilters), {
        credentials: "include",
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "素材列表刷新失败",
          description: formatErrorMessage("请稍后重试。", failure?.message),
        });
        return;
      }

      const payload = (await response.json()) as CategoryCoverAssetListResponse;
      setAssets(payload.items);
      setPage(payload.page);
      setTotal(payload.total);
      setFilters(nextFilters);
    } catch {
      pushFeedback({
        tone: "error",
        title: "素材列表刷新失败",
        description: "网络请求没有成功完成，请重试。",
      });
    } finally {
      setPagePending(false);
    }
  }

  function applyFilters(patch: Partial<AssetFilters>) {
    void loadPage(1, { ...filters, ...patch });
  }

  async function promoteCategoryCoverAsset(assetId: string, nextLabel: string | null) {
    const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/category-cover-assets`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        assetId,
        tone: intakeTone,
        label: nextLabel,
      }),
    });

    if (!response.ok) {
      const failure = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(formatErrorMessage("素材登记失败", failure?.message));
    }
  }

  async function uploadSingleAsset(file: File, nextLabel: string | null) {
    const formData = new FormData();
    formData.append("file", file);

    const upload = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/assets/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!upload.ok) {
      const failure = (await upload.json().catch(() => null)) as { message?: string } | null;
      throw new Error(formatErrorMessage("上传素材失败", failure?.message));
    }

    const uploaded = (await upload.json()) as { id: string };
    await promoteCategoryCoverAsset(uploaded.id, nextLabel);
  }

  async function uploadAssets(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }

    setAssetPending(true);
    const customLabel = label.trim();
    let imported = 0;
    let failed = 0;
    const failures: string[] = [];

    try {
      for (const [index, file] of files.entries()) {
        setAssetTaskLabel(`正在导入 ${index + 1}/${files.length}`);

        try {
          await uploadSingleAsset(file, files.length === 1 && customLabel ? customLabel : file.name);
          imported += 1;
        } catch (error) {
          failed += 1;
          failures.push(`${file.name}：${error instanceof Error ? error.message : "请稍后重试。"}`);
        }
      }

      await loadPage(1);

      if (failed === 0) {
        pushFeedback({
          tone: "success",
          title: files.length > 1 ? "批量导入完成" : "素材已入库",
          description:
            files.length > 1
              ? `已成功导入 ${imported} 张图片，全部进入分类封面素材库。`
              : "图片已写入对象存储，并进入分类封面素材库。",
        });
        return;
      }

      pushFeedback({
        tone: imported > 0 ? "info" : "error",
        title: imported > 0 ? "批量导入部分完成" : "批量导入失败",
        description:
          imported > 0
            ? `成功 ${imported} 张，失败 ${failed} 张。${failures[0] ?? "请稍后重试。"}`
            : failures[0] ?? "请稍后重试。",
      });
    } catch (error) {
      pushFeedback({
        tone: "error",
        title: "批量导入失败",
        description: error instanceof Error ? error.message : "请稍后重试。",
      });
    } finally {
      setAssetTaskLabel(null);
      setAssetPending(false);
    }
  }

  async function importAsset() {
    if (!importUrl.trim()) {
      pushFeedback({
        tone: "error",
        title: "缺少远程图片地址",
        description: "请先输入一个可访问的图片 URL。",
      });
      return;
    }

    setAssetPending(true);
    setAssetTaskLabel("正在抓取远程图片");

    try {
      const imported = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/assets/import`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceUrl: importUrl.trim() }),
      });

      if (!imported.ok) {
        const failure = (await imported.json().catch(() => null)) as { message?: string } | null;
        throw new Error(formatErrorMessage("远程素材导入失败", failure?.message));
      }

      const asset = (await imported.json()) as { id: string };
      const remoteName = importUrl.split("/").at(-1) || "远程分类封面";
      await promoteCategoryCoverAsset(asset.id, label.trim() || remoteName);
      setImportUrl("");
      await loadPage(1);
      pushFeedback({
        tone: "success",
        title: "远程素材已入库",
        description: "图片已抓取到对象存储，并进入分类封面素材库。",
      });
    } catch (error) {
      pushFeedback({
        tone: "error",
        title: "远程素材导入失败",
        description: error instanceof Error ? error.message : "请稍后重试。",
      });
    } finally {
      setAssetTaskLabel(null);
      setAssetPending(false);
    }
  }

  async function deleteAsset(asset: CategoryCoverAssetSummary) {
    setDeletePendingId(asset.id);

    try {
      const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/category-cover-assets/${asset.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "删除素材失败",
          description: formatErrorMessage("请稍后重试。", failure?.message),
        });
        return;
      }

      const nextTotal = Math.max(total - 1, 0);
      const nextPageCount = Math.max(1, Math.ceil(Math.max(nextTotal, 1) / pageSize));
      const nextPage = Math.min(page, nextPageCount);
      setConfirmAsset(null);
      await loadPage(nextPage);
      pushFeedback({
        tone: "success",
        title: "素材已删除",
        description: asset.isAssigned
          ? "原先占用它的分类已解除手动绑定，会继续尝试自动匹配剩余素材。"
          : "素材已经从库中移除。",
      });
    } catch {
      pushFeedback({
        tone: "error",
        title: "删除素材失败",
        description: "网络请求没有成功完成，请重试。",
      });
    } finally {
      setDeletePendingId(null);
    }
  }

  return (
    <div className="admin-grid">
      <AdminConfirmDialog
        cancelLabel="保留素材"
        confirmLabel="删除素材"
        description={
          confirmAsset?.isAssigned
            ? "删除后，这张图会从素材库移除，当前分类的手动绑定也会被解除；如果没有可分配素材，分类会回退到渐变占位。"
            : "删除后，这张图会从素材库永久移除。"
        }
        onCancel={() => setConfirmAsset(null)}
        onConfirm={() => {
          if (!confirmAsset) {
            return;
          }
          void deleteAsset(confirmAsset);
        }}
        open={Boolean(confirmAsset)}
        pending={Boolean(confirmAsset && deletePendingId === confirmAsset.id)}
        title={confirmAsset?.isAssigned ? "确认删除这张已被分类占用的素材吗？" : "确认删除这张素材吗？"}
        tone="danger"
      />

      <section className="admin-card admin-section-card admin-cover-library-stage">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Cover Intake</p>
            <h2>把新图片收入封面素材库</h2>
            <p className="admin-subtle">
              上传或导入成功后，图片会登记为分类封面素材。未手动指定封面的分类，会按 slug 和色调自动尝试匹配未占用素材。
            </p>
          </div>
          <div className="admin-inline-actions">
            <span className="admin-chip">总计 {total} 张</span>
            <span className="admin-chip">每页 {pageSize} 张</span>
          </div>
        </div>

        <div className="admin-asset-grid">
          <div className="admin-card admin-asset-control">
            <p className="admin-kicker">Metadata</p>
            <h3>入库标记</h3>
            <p className="admin-subtle">
              这里的色调和名称会应用到接下来上传或导入的图片，方便后续自动匹配与人工筛选。批量导入时默认使用原文件名，单张导入时才会优先使用这里的素材名称。
            </p>
            <label>
              素材名称
              <input
                placeholder="例如：紫幕极光 / 冷蓝山脊"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label>
              建议色调
              <select value={intakeTone} onChange={(event) => setIntakeTone(event.target.value as CategoryTone)}>
                {toneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-inline-actions">
              <Link className="admin-ghost-button" href="/categories">
                去分类库分配
              </Link>
              <span className="admin-chip">手动指定优先于自动匹配</span>
              <span className="admin-chip">本地图片支持多选批量导入</span>
            </div>
          </div>

          <div className="admin-cover-library-toolbar">
            <div className="admin-card admin-asset-control">
              <p className="admin-kicker">Local Upload</p>
              <h3>批量导入本地图片</h3>
              <p className="admin-subtle">可一次选择多张图片，统一写入 MinIO 并登记到分类封面素材库。</p>
              <label className="admin-upload-button admin-upload-button-wide">
                {assetPending ? assetTaskLabel ?? "处理中..." : "选择图片批量导入"}
                <input
                  accept="image/*"
                  disabled={assetPending}
                  multiple
                  onChange={(event) => {
                    const files = event.target.files;
                    if (files?.length) {
                      void uploadAssets(files);
                    }
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>

            <div className="admin-card admin-asset-control">
              <p className="admin-kicker">Remote Import</p>
              <h3>导入远程图片</h3>
              <p className="admin-subtle">适合把平时收集到的极光图快速拉回对象存储，后面分类可以直接选。</p>
              <label>
                图片 URL
                <div className="admin-inline-field">
                  <input
                    disabled={assetPending}
                    placeholder="https://example.com/aurora.jpg"
                    value={importUrl}
                    onChange={(event) => setImportUrl(event.target.value)}
                  />
                  <button
                    className="admin-primary-button"
                    disabled={assetPending}
                    onClick={() => void importAsset()}
                    type="button"
                  >
                    {assetPending ? assetTaskLabel ?? "处理中..." : "导入"}
                  </button>
                </div>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-card admin-section-card admin-asset-control admin-cover-library-filters">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Filter Library</p>
            <h2>按色调和占用状态筛选素材</h2>
            <p className="admin-subtle">先筛一轮，再分页浏览和删除，素材管理会比现在更顺手。</p>
          </div>
          <div className="admin-inline-actions">
            <span className="admin-chip">{pagePending ? "筛选中..." : `当前结果 ${total} 张`}</span>
            <button
              className="admin-ghost-button"
              disabled={pagePending || (filters.tone === "all" && filters.assignment === "all")}
              onClick={() => void loadPage(1, { tone: "all", assignment: "all" })}
              type="button"
            >
              清空筛选
            </button>
          </div>
        </div>

        <div className="admin-cover-library-filter-grid">
          <label>
            色调
            <select
              disabled={pagePending}
              value={filters.tone}
              onChange={(event) => applyFilters({ tone: event.target.value as CategoryTone | "all" })}
            >
              {filterToneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            占用状态
            <select
              disabled={pagePending}
              value={filters.assignment}
              onChange={(event) =>
                applyFilters({ assignment: event.target.value as CategoryCoverAssetAssignmentFilter })
              }
            >
              {assignmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-cover-library-filter-summary">
            <span className="admin-chip">色调：{filters.tone === "all" ? "全部" : filters.tone}</span>
            <span className="admin-chip">
              状态：
              {filters.assignment === "all"
                ? "全部"
                : filters.assignment === "assigned"
                  ? "已占用"
                  : "未占用"}
            </span>
          </div>
        </div>
      </section>

      {assets.length > 0 ? (
        <section className="admin-cover-library-grid">
          {assets.map((asset) => (
            <article className="admin-card admin-cover-library-card" key={asset.id}>
              <div className="admin-cover-library-media">
                <Image
                  alt={asset.label ?? "分类封面素材"}
                  fill
                  sizes="(max-width: 960px) 100vw, 28vw"
                  src={asset.url}
                  unoptimized
                />
              </div>

              <div className="admin-cover-library-copy">
                <div className="admin-inline-actions">
                  <span className={`admin-status-pill ${asset.isAssigned ? "is-ok" : "is-info"}`}>
                    {asset.isAssigned ? "已占用" : "未占用"}
                  </span>
                  <span className="admin-chip">{asset.tone ?? "未标记"}</span>
                </div>

                <h3>{asset.label ?? "未命名素材"}</h3>
                <p className="admin-subtle">
                  {formatDimensions(asset)} · 入库于 {new Date(asset.createdAt).toLocaleString("zh-CN")}
                </p>
                <p className="admin-subtle">
                  {asset.isAssigned
                    ? `当前用于 ${asset.assignedCategoryName ?? "某个分类"}`
                    : "当前空闲，可被新分类手动选择，也可参与自动匹配。"}
                </p>
              </div>

              <div className="admin-cover-library-footer">
                {asset.assignedCategoryId ? (
                  <Link className="admin-ghost-button" href={`/categories/${asset.assignedCategoryId}`}>
                    查看分类
                  </Link>
                ) : (
                  <span className="admin-chip">可用于自动匹配</span>
                )}
                <button
                  className="admin-danger-button"
                  disabled={Boolean(deletePendingId) || pagePending}
                  onClick={() => setConfirmAsset(asset)}
                  type="button"
                >
                  {deletePendingId === asset.id ? "删除中..." : "删除"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="admin-card admin-cover-library-empty">
          <p className="admin-kicker">Empty Library</p>
          <h2>素材库还没有图片</h2>
          <p className="admin-subtle">
            先上传或导入几张极光图。没有可用素材且分类未手动指定封面时，公开站会回退到渐变占位。
          </p>
        </section>
      )}

      <div className="admin-card admin-pagination">
        <div>
          <p className="admin-kicker">Pagination</p>
          <p className="admin-subtle">
            第 {page} / {pageCount} 页，共 {total} 张素材
          </p>
        </div>
        <div className="admin-inline-actions">
          <button
            className="admin-ghost-button"
            disabled={page <= 1 || pagePending}
            onClick={() => void loadPage(page - 1)}
            type="button"
          >
            上一页
          </button>
          <button
            className="admin-ghost-button"
            disabled={page >= pageCount || pagePending}
            onClick={() => void loadPage(page + 1)}
            type="button"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}

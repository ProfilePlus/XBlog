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
          description: formatErrorMessage("素材库这一页还没能翻开，稍后再试一次。", failure?.message),
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
        description: "这次翻页在路上断开了，再试一次就好。",
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
              ? `一共带回了 ${imported} 张图片，它们都已经落进封面素材库。`
              : "这张图已经收进对象存储，也已经在封面素材库里落名。",
        });
        return;
      }

      pushFeedback({
        tone: imported > 0 ? "info" : "error",
        title: imported > 0 ? "批量导入部分完成" : "批量导入失败",
        description:
          imported > 0
            ? `已经带回 ${imported} 张，还有 ${failed} 张没能顺利入库。${failures[0] ?? "稍后再试一次。"}`
            : failures[0] ?? "这批图片还没能顺利带回来，稍后再试一次。",
      });
    } catch (error) {
      pushFeedback({
        tone: "error",
        title: "批量导入失败",
        description: error instanceof Error ? error.message : "这批图片还没能顺利带回来，稍后再试一次。",
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
        description: "先贴上一张能访问到的图片地址，再把它带回来。",
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
        description: "那张图已经从远处带回，也已经落进封面素材库。",
      });
    } catch (error) {
      pushFeedback({
        tone: "error",
        title: "远程素材导入失败",
        description: error instanceof Error ? error.message : "那张图暂时还没能从远处取回，稍后再试一次。",
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
          description: formatErrorMessage("这张图暂时还没能从素材库退场，稍后再试一次。", failure?.message),
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
          ? "原来认领它的分类已经松开手，接下来会去剩下的素材里继续寻找合适的一张。"
          : "这张图已经从素材库里退场。",
      });
    } catch {
      pushFeedback({
        tone: "error",
        title: "删除素材失败",
        description: "删除动作在路上断开了，再试一次就好。",
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
            ? "删掉之后，这张图会从素材库退场，当前分类和它的手动绑定也会一起解开；如果暂时没有别的图可分，分类会先退回渐变占位。"
            : "删掉之后，这张图会从素材库里彻底退场。"
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
        title={confirmAsset?.isAssigned ? "要把这张仍被分类认领的素材收走吗？" : "要把这张素材从库里收走吗？"}
        tone="danger"
      />

      <section className="admin-card admin-section-card admin-cover-library-stage">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Cover Intake</p>
            <h2>把新图片收入封面素材库</h2>
            <p className="admin-subtle">
              导入后的图片会在这里排成一库。没有手动封面的分类，会先从同色调的空闲图片里认领。
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
              这里写下的名称与色调，会跟着接下来导入的图片一起入库，好让它们日后更容易被认出来。
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
              <p className="admin-subtle">一次带回多张图片，让它们一起落进对象存储，也落进素材库。</p>
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
              <p className="admin-subtle">贴上一张图片地址，后台会把它从远处取回，等着分类来选。</p>
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
            <p className="admin-subtle">先把色调与占用状态筛一遍，再慢慢翻页，会更容易找到那张正合适的图。</p>
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
                    : "这张图暂时还没有去处，既可以手动分配，也会被自动匹配看见。"}
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
            先带几张图回来。没有可用素材的时候，未指定封面的分类会先用渐变占位。
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

"use client";

import { useState } from "react";
import type { AdminArticle, HomeIssue, SiteLogoVariant } from "@xblog/contracts";
import { useAdminFeedback } from "@/components/admin-feedback";
import { LogoPreview } from "@/components/logo-preview";
import { adminConfig } from "@/lib/config";

const logoVariantOptions: {
  value: SiteLogoVariant;
  label: string;
  description: string;
}[] = [
  {
    value: "prototype",
    label: "UI 原型版",
    description: "现在这版 XBlog 字标，最克制，也最接近最初原型。",
  },
  {
    value: "prototype-minimal-glow",
    label: "极简光晕版",
    description: "保留最初 UI 的极简感，把你喜欢的那道光晕做成更干净的 header 字标。",
  },
  {
    value: "aurora-pulse",
    label: "方案 1 / Aurora Pulse",
    description: "保留第一版极光脉冲感，偏品牌字标。",
  },
  {
    value: "aurora-editorial",
    label: "方案 A / Editorial",
    description: "更像内容品牌，和首页大标题语气更接近。",
  },
  {
    value: "aurora-script-lockup",
    label: "方案 B / Script",
    description: "更梦幻、更飘逸，字形带一点书写感。",
  },
  {
    value: "aurora-pill-brand",
    label: "方案 C / Pill",
    description: "更像站点组件本身，和顶部胶囊导航更统一。",
  },
];

export function HomeIssueForm({
  issue,
  articles,
}: {
  issue: HomeIssue;
  articles: AdminArticle[];
}) {
  const [form, setForm] = useState<HomeIssue>({
    ...issue,
    logoVariant: issue.logoVariant ?? "prototype",
  });
  const [pending, setPending] = useState(false);
  const { pushFeedback } = useAdminFeedback();

  async function save() {
    setPending(true);
    try {
      const response = await fetch(`${adminConfig.apiBaseUrl}/v1/admin/home-issue/current`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          issueNumber: form.issueNumber,
          eyebrow: form.eyebrow,
          title: form.title,
          lede: form.lede,
          note: form.note,
          primaryCtaLabel: form.primaryCtaLabel,
          primaryCtaHref: form.primaryCtaHref,
          secondaryCtaLabel: form.secondaryCtaLabel,
          secondaryCtaHref: form.secondaryCtaHref,
          stats: form.stats,
          logoVariant: form.logoVariant,
          heroArticleIds: form.heroArticleIds,
        }),
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { message?: string } | null;
        pushFeedback({
          tone: "error",
          title: "刊期保存失败",
          description: failure?.message ?? "请检查策展位和刊期字段后重试。",
        });
        return;
      }

      pushFeedback({
        tone: "success",
        title: "刊期已保存",
        description: "首页 hero 和刊期信息已经更新。",
      });
    } catch {
      pushFeedback({
        tone: "error",
        title: "刊期保存失败",
        description: "网络请求没有成功完成，请重试。",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-grid">
      <section className="admin-card admin-section-card">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Issue Meta</p>
            <h2>刊期信息</h2>
          </div>
          <button className="admin-primary-button" onClick={save} type="button">
            {pending ? "保存中..." : "保存刊期"}
          </button>
        </div>
        <div className="admin-form">
          <div className="admin-form-grid">
            <label>
              刊号
              <input value={form.issueNumber} onChange={(event) => setForm({ ...form, issueNumber: event.target.value })} />
            </label>
            <label>
              Eyebrow
              <input value={form.eyebrow} onChange={(event) => setForm({ ...form, eyebrow: event.target.value })} />
            </label>
          </div>

          <div className="admin-logo-variant-group">
            <div className="admin-field-head">
              <strong>站点 Logo 方案</strong>
              <span>先保留 6 套方案轮流试用，保存后首页和二级页头部都会同步切换。</span>
            </div>
            <div className="admin-logo-variant-grid">
              {logoVariantOptions.map((option) => (
                <label
                  key={option.value}
                  className={`admin-logo-variant-card ${form.logoVariant === option.value ? "is-active" : ""}`}
                >
                  <input
                    checked={form.logoVariant === option.value}
                    name="logoVariant"
                    onChange={() => setForm({ ...form, logoVariant: option.value })}
                    type="radio"
                    value={option.value}
                  />
                  <LogoPreview variant={option.value} />
                  <strong>{option.label}</strong>
                  <p>{option.description}</p>
                </label>
              ))}
            </div>
          </div>

          <label>
            标题
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>

          <label>
            导语
            <textarea value={form.lede} onChange={(event) => setForm({ ...form, lede: event.target.value })} />
          </label>

          <label>
            Note
            <textarea value={form.note ?? ""} onChange={(event) => setForm({ ...form, note: event.target.value || null })} />
          </label>

          <label>
            首页 stats
            <textarea value={form.stats.join("\n")} onChange={(event) => setForm({ ...form, stats: event.target.value.split("\n").filter(Boolean) })} />
          </label>

          <div className="admin-form-grid">
            <label>
              主按钮文案
              <input
                value={form.primaryCtaLabel}
                onChange={(event) => setForm({ ...form, primaryCtaLabel: event.target.value })}
              />
            </label>
            <label>
              主按钮链接
              <input
                value={form.primaryCtaHref}
                onChange={(event) => setForm({ ...form, primaryCtaHref: event.target.value })}
              />
            </label>
            <label>
              次按钮文案
              <input
                value={form.secondaryCtaLabel}
                onChange={(event) => setForm({ ...form, secondaryCtaLabel: event.target.value })}
              />
            </label>
            <label>
              次按钮链接
              <input
                value={form.secondaryCtaHref}
                onChange={(event) => setForm({ ...form, secondaryCtaHref: event.target.value })}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="admin-card admin-section-card">
        <div className="admin-section-head">
          <div>
            <p className="admin-kicker">Hero Slots</p>
            <h2>首页策展位</h2>
          </div>
        </div>

        <div className="admin-form">
          <label>
            主精选
            <select
              value={form.heroArticleIds.main}
              onChange={(event) =>
                setForm({ ...form, heroArticleIds: { ...form.heroArticleIds, main: event.target.value } })
              }
            >
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            侧卡 1
            <select
              value={form.heroArticleIds.side1}
              onChange={(event) =>
                setForm({ ...form, heroArticleIds: { ...form.heroArticleIds, side1: event.target.value } })
              }
            >
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            侧卡 2
            <select
              value={form.heroArticleIds.side2}
              onChange={(event) =>
                setForm({ ...form, heroArticleIds: { ...form.heroArticleIds, side2: event.target.value } })
              }
            >
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}

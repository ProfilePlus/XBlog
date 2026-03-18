import Link from "next/link";
import { CoverSurface } from "@/components/cover-surface";
import type { FeatureStory } from "@/lib/view-models";

type HeroShowcaseProps = {
  issue: {
    issueNumber: string;
    eyebrow: string;
    title: string;
    lede: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  featuredStories: [FeatureStory, FeatureStory, FeatureStory];
  stats: string[];
};

function heroTitleLines(title: string) {
  const normalized = title.trim();

  if (normalized.includes("\n")) {
    return normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  }

  if (normalized === "让技术、阅读与沉淀，在同一片极光里发光。") {
    return ["让技术、阅读与", "沉淀，在同一片", "极光里发光。"];
  }

  return [normalized];
}

function compactIssueStat(stat: string) {
  return stat
    .replace("个主分类", "个分类")
    .replace("篇精选文章", "篇精选")
    .replace("篇待整理收录", "篇待整理");
}

function coverStoryDisplay(title: string, description: string) {
  const normalizedTitle = title.trim();
  const normalizedDescription = description.trim();
  const separatorMatch = normalizedTitle.match(/[:：]/);

  if (!separatorMatch) {
    return {
      displayTitle: normalizedTitle,
      subtitle: normalizedDescription,
    };
  }

  const separatorIndex = separatorMatch.index ?? -1;
  const lead = normalizedTitle.slice(0, separatorIndex).trim();
  const tail = normalizedTitle.slice(separatorIndex + 1).trim();
  const compactTail = tail
    .replace(/^一个关于\s*/u, "")
    .replace(/^关于\s*/u, "")
    .replace(/^如何把\s*/u, "")
    .replace(/^为什么\s*/u, "")
    .trim();
  const shortLead = /^《.+》$/u.test(lead) || lead.length <= 10;
  const displayTitle = shortLead ? lead : `${lead}：${compactTail || tail}`;
  const subtitle = shortLead
    ? compactTail || tail || normalizedDescription
    : normalizedDescription || (displayTitle === normalizedTitle ? "" : normalizedTitle);

  return {
    displayTitle,
    subtitle,
  };
}

export function HeroShowcase({
  issue,
  featuredStories,
  stats,
}: HeroShowcaseProps) {
  const [coverStory, sideStoryOne, sideStoryTwo] = featuredStories;
  const issueData = stats.map(compactIssueStat).join(" / ");
  const currentTheme = issue.eyebrow.replace(/^XBlog\s*\/\s*/i, "") || "Aurora Edition";
  const coverEchoMark = issue.issueNumber.match(/\d+/)?.[0]?.padStart(2, "0") ?? "01";
  const coverEchoTheme = currentTheme.replace(/\bEdition\b/i, "").trim() || currentTheme;
  const coverStoryCopy = coverStoryDisplay(coverStory.title, coverStory.description);
  const titleLines = heroTitleLines(issue.title);

  return (
    <section className="showcase-hero">
      <article className="hero-panel card glass" data-issue-mark={coverEchoMark}>
        <p className="eyebrow">{issue.eyebrow}</p>
        <h1>
          {titleLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <div className="hero-panel-support">
          <p className="lede">{issue.lede}</p>
          <div className="actions">
            <Link href={issue.primaryCtaHref} className="action-button">
              {issue.primaryCtaLabel}
            </Link>
            <Link href={issue.secondaryCtaHref} className="action-button ghost">
              {issue.secondaryCtaLabel}
            </Link>
          </div>
          <div className="hero-cover-echo">
            <div className="hero-cover-echo-note">
              <span className="hero-cover-echo-label">Issue Data</span>
              <p>{issueData}</p>
            </div>
            <div className="hero-cover-echo-note hero-cover-echo-note--theme">
              <span className="hero-cover-echo-label">Theme</span>
              <strong>{`${coverEchoTheme} ${coverEchoMark}`}</strong>
            </div>
          </div>
        </div>
      </article>

      <div className="feature-stack">
        <div className="hero-visual-grid">
          <Link href={coverStory.href} className="card glass hero-visual hero-card-link">
            <CoverSurface
              alt={coverStory.title}
              className="cover cover-main"
              coverUrl={coverStory.coverUrl}
              priority
              sizes="(max-width: 1100px) 100vw, 40vw"
              tone={coverStory.tone}
            />
            <div className="hero-meta">
              <span className="chip">{coverStory.category}</span>
              <h2>{coverStoryCopy.displayTitle}</h2>
              {coverStoryCopy.subtitle ? <p className="hero-cover-subtitle">{coverStoryCopy.subtitle}</p> : null}
              <div className="author-row">
                <div className="avatar" />
                <span>{coverStory.authorLabel}</span>
              </div>
            </div>
          </Link>

          <div className="side-stack">
            <Link href={sideStoryOne.href} className="micro-card micro-card-link card glass">
              <CoverSurface
                alt={sideStoryOne.title}
                className="cover cover-small"
                coverUrl={sideStoryOne.coverUrl}
                sizes="(max-width: 1100px) 100vw, 20vw"
                tone={sideStoryOne.tone}
              />
              <strong>{sideStoryOne.title}</strong>
              <p>{sideStoryOne.description}</p>
            </Link>
            <Link href={sideStoryTwo.href} className="micro-card micro-card-link card glass">
              <CoverSurface
                alt={sideStoryTwo.title}
                className="cover cover-small"
                coverUrl={sideStoryTwo.coverUrl}
                sizes="(max-width: 1100px) 100vw, 20vw"
                tone={sideStoryTwo.tone}
              />
              <strong>{sideStoryTwo.title}</strong>
              <p>{sideStoryTwo.description}</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

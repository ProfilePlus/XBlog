export type StoryCard = {
  title: string;
  description: string;
  category: string;
  tone: "pink" | "blue" | "green" | "aurora";
  href: string;
};

export type TopicShelf = {
  name: string;
  summary: string;
  articleCount: string;
  tone: "pink" | "blue" | "green" | "aurora";
  href: string;
};

export type CreatorTool = {
  badge: string;
  title: string;
  description: string;
  href: string;
};

export type CompactEntry = {
  title: string;
  description: string;
  tone: "pink" | "blue" | "green";
  href: string;
};

export const featuredStories: StoryCard[] = [
  {
    title: "如何把外部好文章收录成自己的知识资产",
    description: "把外部文章从一条链接，慢慢整理成自己能反复取用的知识页。",
    category: "封面精选",
    tone: "aurora",
    href: "/articles/curate-external-articles",
  },
  {
    title: "本周新写",
    description: "本周写下的交互、 Agent 与部署笔记，都在这里归拢成册。",
    category: "近期写作",
    tone: "pink",
    href: "/articles/tools-into-methodology",
  },
  {
    title: "最近收录",
    description: "最近收回来的技术文章，会在这里继续被翻译、润色与再组织。",
    category: "阅读日志",
    tone: "green",
    href: "/articles/ai-orchestration-boundaries",
  },
];

export const siteStats = ["4 个主分类", "12 篇精选文章", "7 篇待整理收录"];

export const topicShelves: TopicShelf[] = [
  {
    name: "前端交互",
    summary: "把布局、动效、组件与可读性，慢慢磨成顺手的界面经验。",
    articleCount: "18 篇文章",
    tone: "blue",
    href: "/categories/frontend-interaction",
  },
  {
    name: "AI / Agent",
    summary: "记录 OpenClaw、Codex 与多 Agent 协作，如何一点点沉成方法。",
    articleCount: "12 篇文章",
    tone: "pink",
    href: "/categories/ai-agent",
  },
  {
    name: "系统设计",
    summary: "把架构、部署、存储与扩展问题放在一起，反复推敲。",
    articleCount: "9 篇文章",
    tone: "green",
    href: "/categories/systems-design",
  },
  {
    name: "工具流",
    summary: "把常用工具与脚本收束成流程，让零散习惯长成稳定方法。",
    articleCount: "15 篇文章",
    tone: "aurora",
    href: "/categories/toolcraft",
  },
];

export const creatorTools: CreatorTool[] = [
  {
    badge: "写",
    title: "写新文章",
    description: "从标题到封面，再到正文与发布，一篇新文章会在这里慢慢成形。",
    href: "/articles/why-rebuild-xblog",
  },
  {
    badge: "收",
    title: "整理收录内容",
    description: "把 OpenClaw 带回来的文章翻成中文、磨去生硬，再收入内容库。",
    href: "/articles/curate-external-articles",
  },
  {
    badge: "管",
    title: "维护分类体系",
    description: "把分类标题、摘要、封面与代表文章整理好，让首页分区各有气质。",
    href: "/categories",
  },
];

export const latestEssays: CompactEntry[] = [
  {
    title: "为什么我想重做这个博客",
    description: "写的是为什么要把一个博客，慢慢改造成能持续策展的地方。",
    tone: "pink",
    href: "/articles/why-rebuild-xblog",
  },
  {
    title: "梦幻 UI 也应该有稳定秩序",
    description: "写的是视觉不该只有惊艳，也该有秩序和停留的余地。",
    tone: "blue",
    href: "/articles/dreamy-ui-needs-order",
  },
  {
    title: "收录功能为什么是 XBlog 的核心",
    description: "写的是收录为何不止于收藏，而是一次重新理解和重新组织。",
    tone: "green",
    href: "/articles/curation-is-core",
  },
];

export const readingLogs: CompactEntry[] = [
  {
    title: "UI 系统里的秩序与节奏",
    description: "这篇谈界面的节奏与层级，后面会补上我自己的落地笔记。",
    tone: "blue",
    href: "/articles/ui-rhythm-order",
  },
  {
    title: "AI 编排系统的真实边界",
    description: "这篇谈多 Agent 的边界，后面会补上部署与监控的视角。",
    tone: "pink",
    href: "/articles/ai-orchestration-boundaries",
  },
  {
    title: "技术写作的封面叙事感",
    description: "这篇谈封面如何改变入口，后面会补上首页改版时的取舍。",
    tone: "green",
    href: "/articles/cover-narrative-tech-writing",
  },
];

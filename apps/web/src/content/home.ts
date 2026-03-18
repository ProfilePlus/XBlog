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
    description: "把阅读、整理、再表达放在同一个工作流里，让好内容真正留下来。",
    category: "封面精选",
    tone: "aurora",
    href: "/articles/curate-external-articles",
  },
  {
    title: "本周新写",
    description: "交互设计、Agent 工作流与部署实践。",
    category: "近期写作",
    tone: "pink",
    href: "/articles/tools-into-methodology",
  },
  {
    title: "最近收录",
    description: "最近收录 7 篇高质量技术文章，等待二次整理。",
    category: "阅读日志",
    tone: "green",
    href: "/articles/ai-orchestration-boundaries",
  },
];

export const siteStats = ["4 个主分类", "12 篇精选文章", "7 篇待整理收录"];

export const topicShelves: TopicShelf[] = [
  {
    name: "前端交互",
    summary: "布局、动效、信息层级与组件体验，强调梦幻感里的清晰。",
    articleCount: "18 篇文章",
    tone: "blue",
    href: "/categories/frontend-interaction",
  },
  {
    name: "AI / Agent",
    summary: "OpenClaw、Codex、自动化协作与知识沉淀方法。",
    articleCount: "12 篇文章",
    tone: "pink",
    href: "/categories/ai-agent",
  },
  {
    name: "系统设计",
    summary: "架构、部署、可维护性与后续扩展路线。",
    articleCount: "9 篇文章",
    tone: "green",
    href: "/categories/systems-design",
  },
  {
    name: "工具流",
    summary: "把日常工具、流程和工作习惯变成稳定可复用的方法论。",
    articleCount: "15 篇文章",
    tone: "aurora",
    href: "/categories/toolcraft",
  },
];

export const creatorTools: CreatorTool[] = [
  {
    badge: "写",
    title: "写新文章",
    description: "进入专属编辑区，统一处理封面、分类、摘要与发布。",
    href: "/articles/why-rebuild-xblog",
  },
  {
    badge: "收",
    title: "整理收录内容",
    description: "把 OpenClaw 带回来的文章转成可沉淀、可检索的知识卡片。",
    href: "/articles/curate-external-articles",
  },
  {
    badge: "管",
    title: "维护分类体系",
    description: "分类、标签、封面图和代表文章都在同一工作流内管理。",
    href: "/categories",
  },
];

export const latestEssays: CompactEntry[] = [
  {
    title: "为什么我想重做这个博客",
    description: "从复杂、分散、朴素，走向惊艳、集中、长期可读。",
    tone: "pink",
    href: "/articles/why-rebuild-xblog",
  },
  {
    title: "梦幻 UI 也应该有稳定秩序",
    description: "真正高级的视觉不是堆效果，而是把情绪和结构一起设计好。",
    tone: "blue",
    href: "/articles/dreamy-ui-needs-order",
  },
  {
    title: "收录功能为什么是 XBlog 的核心",
    description: "它让看过变成拥有过、理解过、重新组织过。",
    tone: "green",
    href: "/articles/curation-is-core",
  },
];

export const readingLogs: CompactEntry[] = [
  {
    title: "UI 系统里的秩序与节奏",
    description: "已收录，待补在博客里如何落地的个人摘要。",
    tone: "blue",
    href: "/articles/ui-rhythm-order",
  },
  {
    title: "AI 编排系统的真实边界",
    description: "已收录，准备归入 Agent 分类并补部署视角评论。",
    tone: "pink",
    href: "/articles/ai-orchestration-boundaries",
  },
  {
    title: "技术写作的封面叙事感",
    description: "已收录，计划改写为如何设计高辨识博客首页。",
    tone: "green",
    href: "/articles/cover-narrative-tech-writing",
  },
];

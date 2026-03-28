import type { CreatorTool } from "@/lib/view-models";
import { adminAppUrl } from "@/lib/site-links";

export const creatorTools: CreatorTool[] = [
  {
    badge: "写",
    title: "写新文章",
    description: "从标题到封面，再到正文与发布，一篇新文章会在这里慢慢成形。",
    href: `${adminAppUrl}/articles/new`,
  },
  {
    badge: "收",
    title: "整理收录内容",
    description: "把 OpenClaw 带回来的文章翻成中文、磨去生硬，再收入内容库。",
    href: `${adminAppUrl}/articles`,
  },
  {
    badge: "管",
    title: "维护分类体系",
    description: "把分类标题、摘要、封面与代表文章整理好，让首页分区各有气质。",
    href: `${adminAppUrl}/categories`,
  },
];

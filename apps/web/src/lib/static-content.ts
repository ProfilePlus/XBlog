import type { CreatorTool } from "@/lib/view-models";
import { adminAppUrl } from "@/lib/site-links";

export const creatorTools: CreatorTool[] = [
  {
    badge: "写",
    title: "写新文章",
    description: "进入专属编辑区，统一处理封面、分类、摘要与发布。",
    href: `${adminAppUrl}/articles/new`,
  },
  {
    badge: "收",
    title: "整理收录内容",
    description: "把 OpenClaw 带回来的文章转成可沉淀、可检索的知识卡片。",
    href: `${adminAppUrl}/articles`,
  },
  {
    badge: "管",
    title: "维护分类体系",
    description: "分类、标签、封面图和代表文章都在同一工作流内管理。",
    href: `${adminAppUrl}/categories`,
  },
];

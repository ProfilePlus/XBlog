export type LibraryTone = "pink" | "blue" | "green" | "aurora";

export type LibraryCategory = {
  slug: string;
  name: string;
  summary: string;
  articleCountLabel: string;
  tone: LibraryTone;
  heroTitle: string;
  longSummary: string;
  curatorNote: string;
  focusAreas: string[];
  featuredArticleSlug: string;
};

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

export type LibraryArticle = {
  slug: string;
  title: string;
  excerpt: string;
  lede: string;
  categorySlug: string;
  tone: LibraryTone;
  publishedAt: string;
  readingTime: string;
  kind: "原创写作" | "收录整理";
  authorName: string;
  authorRole: string;
  highlights: string[];
  sections: ArticleSection[];
  relatedSlugs: string[];
};

export const libraryCategories: LibraryCategory[] = [
  {
    slug: "frontend-interaction",
    name: "前端交互",
    summary: "布局、动效、信息层级与组件体验，强调梦幻感里的清晰。",
    articleCountLabel: "18 篇文章",
    tone: "blue",
    heroTitle: "把阅读感、交互秩序和视觉氛围放进同一个前端页面里。",
    longSummary:
      "这一类文章关注博客真正被看见时的体验：从大标题的节奏，到卡片密度、留白、状态切换，再到页面是否有品牌感与阅读感。",
    curatorNote:
      "这里不是在堆华丽效果，而是在练习如何让情绪化视觉也保持清晰、稳定、长期可读。",
    focusAreas: ["Hero 版式", "阅读型卡片", "响应式秩序", "视觉层级"],
    featuredArticleSlug: "dreamy-ui-needs-order",
  },
  {
    slug: "ai-agent",
    name: "AI / Agent",
    summary: "OpenClaw、Codex、自动化协作与知识沉淀方法。",
    articleCountLabel: "12 篇文章",
    tone: "pink",
    heroTitle: "把 Agent 能力接进真实的写作、收录与交付流程里。",
    longSummary:
      "这里收录我对多 Agent 编排、任务流拆解、自动化内容整理和工作流验证的观察，重点是它们在实际项目里的边界与价值。",
    curatorNote:
      "AI 最有价值的时候，不是替代判断，而是把重复的整理、联调和推进动作接管掉。",
    focusAreas: ["Agent 编排", "收录工作流", "自动化验证", "协作边界"],
    featuredArticleSlug: "curate-external-articles",
  },
  {
    slug: "systems-design",
    name: "系统设计",
    summary: "架构、部署、可维护性与后续扩展路线。",
    articleCountLabel: "9 篇文章",
    tone: "green",
    heroTitle: "让博客从一个漂亮页面，长成能持续迭代的内容系统。",
    longSummary:
      "这一类内容关注数据模型、部署结构、可扩展的页面体系和后续社交能力的落点，确保博客后面能继续演化而不是推倒重来。",
    curatorNote:
      "系统设计不是把技术堆厚，而是提前给未来的增长预留最恰当的骨架。",
    focusAreas: ["内容模型", "部署结构", "信息架构", "可维护性"],
    featuredArticleSlug: "stable-content-models",
  },
  {
    slug: "toolcraft",
    name: "工具流",
    summary: "把日常工具、流程和工作习惯变成稳定可复用的方法论。",
    articleCountLabel: "15 篇文章",
    tone: "aurora",
    heroTitle: "把每天的工具选择、工作节奏和整理习惯，慢慢做成自己的方法学。",
    longSummary:
      "这一类文章更像后台的工作手册：记录我如何使用 Codex、Playwright、OpenClaw 和各种辅助流程，把灵感推进成真正的产品交付。",
    curatorNote:
      "好工具不是越多越好，关键是能不能被整理成一套稳定、低成本、可复用的路径。",
    focusAreas: ["Codex 协作", "验证流程", "知识沉淀", "交付节奏"],
    featuredArticleSlug: "curation-is-core",
  },
];

export const libraryArticles: LibraryArticle[] = [
  {
    slug: "curate-external-articles",
    title: "如何把外部好文章收录成自己的知识资产",
    excerpt: "把阅读、整理、再表达放在同一个工作流里，让好内容真正留下来。",
    lede:
      "真正有价值的收录，不是把链接搬进数据库，而是把别人的信息重新转译成自己的判断、结构和表达方式。",
    categorySlug: "ai-agent",
    tone: "aurora",
    publishedAt: "2026 年 3 月 14 日",
    readingTime: "8 分钟",
    kind: "原创写作",
    authorName: "Lin",
    authorRole: "Reading System",
    highlights: [
      "先记录来源，再提炼自己的判断。",
      "让收录页、分类页和文章页共享同一套内容模型。",
      "把 OpenClaw 带回来的信息重新整理成知识卡片。",
    ],
    sections: [
      {
        heading: "收录的目标不是囤积，而是重构理解",
        paragraphs: [
          "很多博客把“收藏”当作终点，但对我来说，收藏只是阅读的起点。真正重要的是把原文的脉络拆开，变成自己的摘要、观点和后续行动。",
          "所以 XBlog 的收录内容不会只是原文镜像，而会带上我的注释、分类、改写线索和后续关联文章，让它们慢慢进入自己的知识地图。",
        ],
      },
      {
        heading: "OpenClaw 负责带回信息，XBlog 负责把信息留下来",
        paragraphs: [
          "OpenClaw 的价值在于帮我快速读取、抓取和整理来源，但知识沉淀必须发生在 XBlog 这一层，因为这里才有我的分类体系、封面叙事和长期写作语境。",
          "当收录流接进博客以后，阅读就不再是零散动作，而是一个可以持续积累、持续检索、持续再表达的流程。",
        ],
      },
      {
        heading: "内容模型要先允许二次整理",
        paragraphs: [
          "收录文章的字段里，不该只有标题和链接，还需要‘我的摘要’、‘准备归入哪个分类’、‘未来可能发展成哪篇原创’这些对创作真正有帮助的信息。",
          "这样一来，收录内容才能继续长成专题、合集、精选推荐和更完整的原创文章。",
        ],
      },
    ],
    relatedSlugs: ["ai-orchestration-boundaries", "curation-is-core", "stable-content-models"],
  },
  {
    slug: "why-rebuild-xblog",
    title: "为什么我想重做这个博客",
    excerpt: "从复杂、分散、朴素，走向惊艳、集中、长期可读。",
    lede:
      "我不想再维护一个功能看似很多、但读起来没有气质、用起来也没有秩序的博客了。XBlog 想从第一屏开始就明确：这是一个有审美、有结构、也有方法论的个人知识空间。",
    categorySlug: "frontend-interaction",
    tone: "pink",
    publishedAt: "2026 年 3 月 14 日",
    readingTime: "6 分钟",
    kind: "原创写作",
    authorName: "Lin",
    authorRole: "Builder",
    highlights: [
      "页面不再分散入口，而是固定核心功能区。",
      "首屏必须有品牌感，而不是普通博客模板感。",
      "后续扩展注册、关注和订阅时，基础秩序不能被打散。",
    ],
    sections: [
      {
        heading: "上一版博客的问题不是单点，而是整体体验失焦",
        paragraphs: [
          "LBlog 让我最不满意的地方，不是某个组件不好看，而是整体看下来没有形成真正的阅读节奏。页面太复杂，交互逻辑不够清楚，视觉也不够有辨识度。",
          "这会让内容本身失去应有的重量，读者甚至很难在第一眼判断这个博客到底想表达什么。",
        ],
      },
      {
        heading: "XBlog 要先做成一个稳定的个人知识场",
        paragraphs: [
          "首版我不急着做社区，而是先把个人沉淀、分类阅读、文章详情和收录工作流打磨完整。只有这套骨架稳定了，后面再叠加关注、收藏和订阅才不会显得散。",
          "这也是为什么首页会被设计成带强烈品牌感的内容首页，而不是单纯的信息列表。",
        ],
      },
    ],
    relatedSlugs: ["dreamy-ui-needs-order", "curation-is-core", "stable-content-models"],
  },
  {
    slug: "dreamy-ui-needs-order",
    title: "梦幻 UI 也应该有稳定秩序",
    excerpt: "真正高级的视觉不是堆效果，而是把情绪和结构一起设计好。",
    lede:
      "梦幻感并不意味着页面可以失控。越是带气氛、带情绪的视觉系统，越需要一个稳定、清晰、可维护的骨架来承托。",
    categorySlug: "frontend-interaction",
    tone: "blue",
    publishedAt: "2026 年 3 月 14 日",
    readingTime: "7 分钟",
    kind: "原创写作",
    authorName: "Lin",
    authorRole: "UI System",
    highlights: [
      "先定视觉骨架，再加情绪层。",
      "卡片比例和标题节奏决定第一眼是否惊艳。",
      "品牌感来自一致的秩序，不只是渐变和光效。",
    ],
    sections: [
      {
        heading: "先有秩序，梦幻感才会高级",
        paragraphs: [
          "我想要的不是一张充满渐变色和玻璃效果的页面，而是一张在秩序里发光的页面。用户应该先感受到稳定的布局，再感受到极光色带来的情绪。",
          "这也是 concept D 最后胜出的原因：它兼顾了首屏冲击、分类清晰和一点杂志式的独特气质。",
        ],
      },
      {
        heading: "阅读型页面需要更强的版式控制",
        paragraphs: [
          "博客和纯产品站不一样，它最终还是要服务阅读。所以标题行高、说明文字密度、图片区与正文的重心比例，都必须在‘好看’和‘能读’之间找到平衡。",
          "当这些关系稳定下来后，视觉系统才具备长期复用的价值。",
        ],
      },
    ],
    relatedSlugs: ["why-rebuild-xblog", "cover-narrative-tech-writing", "ui-rhythm-order"],
  },
  {
    slug: "curation-is-core",
    title: "收录功能为什么是 XBlog 的核心",
    excerpt: "它让看过变成拥有过、理解过、重新组织过。",
    lede:
      "如果没有收录能力，博客就只是输出的终点；当收录流被设计进来以后，博客才会变成输入和输出持续循环的中枢。",
    categorySlug: "toolcraft",
    tone: "green",
    publishedAt: "2026 年 3 月 14 日",
    readingTime: "6 分钟",
    kind: "原创写作",
    authorName: "Lin",
    authorRole: "Workflow Designer",
    highlights: [
      "收录让阅读和写作重新接上。",
      "一篇外部好文章可以长成一张知识卡片。",
      "同一个系统里处理输入和输出，效率更高。",
    ],
    sections: [
      {
        heading: "阅读如果不能进入系统，很快就会消散",
        paragraphs: [
          "日常看到的好文章很多，但如果只是看过、转发过，它们通常不会真正留下来。久而久之，阅读变成了无效堆积。",
          "XBlog 想做的是把这些信息重新吸附进自己的系统里，让它们和原创写作发生关系。",
        ],
      },
      {
        heading: "收录能力让博客具备持续生长的输入端",
        paragraphs: [
          "原创内容是输出端，收录内容是输入端。两者放进同一套分类、同一套封面语言和同一套管理工作流里，博客就会开始形成自我增长的循环。",
          "后面无论是做专题推荐，还是生成后续长文，都能直接利用已经整理好的收录内容。",
        ],
      },
    ],
    relatedSlugs: ["curate-external-articles", "tools-into-methodology", "stable-content-models"],
  },
  {
    slug: "ui-rhythm-order",
    title: "UI 系统里的秩序与节奏",
    excerpt: "已收录，待补在博客里如何落地的个人摘要。",
    lede:
      "这篇收录文章让我重新确认了一件事：真正成熟的界面系统，不只是组件库齐全，而是每一层视觉与交互都有稳定节奏。",
    categorySlug: "frontend-interaction",
    tone: "blue",
    publishedAt: "2026 年 3 月 13 日",
    readingTime: "5 分钟",
    kind: "收录整理",
    authorName: "Lin",
    authorRole: "Reading Log",
    highlights: [
      "组件间距比单个组件更能暴露系统是否成熟。",
      "节奏感会直接影响阅读速度和理解效率。",
      "博客页面同样需要像产品系统一样被管理。",
    ],
    sections: [
      {
        heading: "秩序先于装饰",
        paragraphs: [
          "文章提到，很多界面看起来不舒服，往往不是因为缺少视觉效果，而是因为元素之间没有形成稳定的间距、比例和节奏。",
          "这和我重做 XBlog 的判断高度一致。页面真正决定气质的，首先是结构关系，而不是装饰层。",
        ],
      },
      {
        heading: "下一步会把这套思路继续落到详情页",
        paragraphs: [
          "首页已经证明了同一套规则可以支撑梦幻感和清晰度并存。接下来文章页也要用一样的规则处理封面、目录、引用和相关内容区。",
        ],
      },
    ],
    relatedSlugs: ["dreamy-ui-needs-order", "why-rebuild-xblog", "cover-narrative-tech-writing"],
  },
  {
    slug: "ai-orchestration-boundaries",
    title: "AI 编排系统的真实边界",
    excerpt: "已收录，准备归入 Agent 分类并补部署视角评论。",
    lede:
      "AI 编排系统最容易被夸大的地方，是把任务自动化想象成了判断自动化。真正稳定的系统，需要把边界写进流程里。",
    categorySlug: "ai-agent",
    tone: "pink",
    publishedAt: "2026 年 3 月 13 日",
    readingTime: "5 分钟",
    kind: "收录整理",
    authorName: "Lin",
    authorRole: "Agent Notes",
    highlights: [
      "自动化擅长推进，不擅长替代目标判断。",
      "多 Agent 工作流最怕缺少边界定义。",
      "验证层应该独立于生成层存在。",
    ],
    sections: [
      {
        heading: "编排系统解决的是推进问题",
        paragraphs: [
          "文章最有价值的点，是把‘自动化推进’和‘人工裁决’明确分开。一个好的系统可以主动拆任务、执行任务、回传证据，但仍然需要人类给出方向和审美判断。",
          "这和我把 Symphony 放在后面再考虑的判断相符：在产品结构没稳定之前，流程编排不是第一优先。",
        ],
      },
      {
        heading: "XBlog 里更适合先落地的是轻量工作流",
        paragraphs: [
          "对现在的博客项目来说，先把内容模型、页面系统和验证闭环跑顺，比接一层复杂编排平台更实际。",
          "所以我会优先把 Codex、Playwright 和收录流组织成稳定的开发节奏，而不是过早引入更重的自动化总控层。",
        ],
      },
    ],
    relatedSlugs: ["curate-external-articles", "tools-into-methodology", "stable-content-models"],
  },
  {
    slug: "cover-narrative-tech-writing",
    title: "技术写作的封面叙事感",
    excerpt: "已收录，计划改写为如何设计高辨识博客首页。",
    lede:
      "技术文章当然需要信息密度，但封面与第一屏的叙事感同样重要。它们决定读者是否愿意进入你的内容世界。",
    categorySlug: "frontend-interaction",
    tone: "green",
    publishedAt: "2026 年 3 月 13 日",
    readingTime: "4 分钟",
    kind: "收录整理",
    authorName: "Lin",
    authorRole: "Editorial Study",
    highlights: [
      "首屏的故事感会放大整站辨识度。",
      "封面不只是配图，而是阅读预告。",
      "品牌感来自版式、节奏和主题的一致性。",
    ],
    sections: [
      {
        heading: "博客首页也需要像封面一样被设计",
        paragraphs: [
          "我很认同文中提到的‘封面叙事’概念。技术博客不是只能长得像文档站，它也可以像杂志一样，在第一屏先传达品牌和气氛。",
          "concept D 的方向正是基于这个判断：首屏必须先让人感受到你是谁，再去解释你写什么。",
        ],
      },
      {
        heading: "下一步会把这种叙事感带进文章详情页",
        paragraphs: [
          "详情页不能只剩下纯文本。封面、作者信息、关键摘要和相关推荐，同样应该被组织成一个有阅读节奏的页面。",
        ],
      },
    ],
    relatedSlugs: ["dreamy-ui-needs-order", "why-rebuild-xblog", "ui-rhythm-order"],
  },
  {
    slug: "stable-content-models",
    title: "给可持续博客准备一套稳定内容模型",
    excerpt: "当页面、分类、收录与后续社区功能都要共存时，数据结构必须先站稳。",
    lede:
      "博客不是做完首页就结束了。只要它未来还要长出分类、详情、收录、收藏与关注，内容模型就必须一开始就能承接这些变化。",
    categorySlug: "systems-design",
    tone: "green",
    publishedAt: "2026 年 3 月 14 日",
    readingTime: "7 分钟",
    kind: "原创写作",
    authorName: "Lin",
    authorRole: "Content Architect",
    highlights: [
      "先抽象统一的文章实体，再区分原创和收录。",
      "分类、标签、封面图和精选状态都应是同层字段。",
      "模型稳定后，页面系统才能稳定扩张。",
    ],
    sections: [
      {
        heading: "不要为每个页面单独造一套数据",
        paragraphs: [
          "首页想要精选卡，分类页想要列表，文章页想要正文，收录页想要原文来源。如果每个页面各写一套数据结构，后面会越来越难维护。",
          "所以我更倾向于先定义统一文章实体，再通过派生字段去支持不同页面。",
        ],
      },
      {
        heading: "未来功能越多，越需要现在先克制",
        paragraphs: [
          "关注、收藏、订阅这些能力不是首版重点，但内容模型应该允许它们未来平滑接入。只要骨架稳了，页面和功能都可以继续长。",
        ],
      },
    ],
    relatedSlugs: ["why-rebuild-xblog", "curation-is-core", "deployment-foundations"],
  },
  {
    slug: "deployment-foundations",
    title: "为持续迭代的博客准备部署与预览基础",
    excerpt: "快速预览、稳定构建和清晰的环境边界，会决定博客后续的迭代速度。",
    lede:
      "一个内容产品如果没有顺手的预览和部署通路，设计和实现之间就会反复脱节。越早把预览链路搭稳，后面每次迭代越轻松。",
    categorySlug: "systems-design",
    tone: "blue",
    publishedAt: "2026 年 3 月 14 日",
    readingTime: "6 分钟",
    kind: "原创写作",
    authorName: "Lin",
    authorRole: "Delivery Notes",
    highlights: [
      "每次视觉定稿都应该有可对比的真实页面。",
      "本地开发、构建和线上预览需要同一套节奏。",
      "越早建立验证流程，越不容易返工。",
    ],
    sections: [
      {
        heading: "预览能力本身就是设计流程的一部分",
        paragraphs: [
          "这次 XBlog 首页能真正锁定下来，很大一部分原因就是设计图、运行页和截图 diff 被接进了同一个工作流里。",
          "这说明部署与预览并不只是后端问题，它们直接决定前端设计能否稳定收敛。",
        ],
      },
      {
        heading: "后续页面也应该沿用同一套验证路径",
        paragraphs: [
          "分类页、详情页、后面的创作工作台，都应该维持同样的节奏：先设计，再实现，再浏览器比对，再确认进入下一阶段。",
        ],
      },
    ],
    relatedSlugs: ["stable-content-models", "ai-orchestration-boundaries", "tools-into-methodology"],
  },
  {
    slug: "tools-into-methodology",
    title: "把日常工具流整理成稳定的方法论",
    excerpt: "Codex、Playwright、OpenClaw 和部署工具，只有被组织成稳定流程时才真正有价值。",
    lede:
      "我越来越不想追求‘有什么新工具’，而是更在意‘这些工具能不能拼成一条稳定的路’。当方法稳定下来，效率和质量都会跟着稳定。",
    categorySlug: "toolcraft",
    tone: "aurora",
    publishedAt: "2026 年 3 月 14 日",
    readingTime: "6 分钟",
    kind: "原创写作",
    authorName: "Lin",
    authorRole: "Workflow Builder",
    highlights: [
      "技能推荐应该跟着任务阶段走。",
      "浏览器验证应当成为页面开发的固定环节。",
      "会话记忆和交付技能可以减少上下文损失。",
    ],
    sections: [
      {
        heading: "工具越多，越需要先整理顺序",
        paragraphs: [
          "如果没有阶段感和顺序感，工具只会带来更多切换成本。真正有效的做法，是先定义任务阶段，再为每个阶段配一小组最合适的能力。",
          "这也是我把 skill 推荐写进流程的原因：每次任务开始前，都先告诉自己这轮最该用哪些东西。",
        ],
      },
      {
        heading: "方法论的价值在于可以重复",
        paragraphs: [
          "当‘一句话需求 -> UI -> 开发 -> 浏览器比对 -> 交付’这条链路真的能重复执行时，项目才开始具备可持续推进的感觉。",
          "XBlog 后面会继续把这些经验沉淀成自己的交付 skill，而不是只靠一次性的人工记忆。",
        ],
      },
    ],
    relatedSlugs: ["curation-is-core", "deployment-foundations", "ai-orchestration-boundaries"],
  },
];

export function getCategoryBySlug(slug: string) {
  return libraryCategories.find((category) => category.slug === slug);
}

export function getArticleBySlug(slug: string) {
  return libraryArticles.find((article) => article.slug === slug);
}

export function getArticlesByCategory(categorySlug: string) {
  return libraryArticles.filter((article) => article.categorySlug === categorySlug);
}

export function getRelatedArticles(article: LibraryArticle) {
  return article.relatedSlugs
    .map((slug) => getArticleBySlug(slug))
    .filter((entry): entry is LibraryArticle => Boolean(entry));
}

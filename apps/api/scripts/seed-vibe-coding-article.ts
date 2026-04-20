import { PrismaClient } from "@prisma/client";
import { randomId } from "../src/lib/security";

async function main() {
  const prisma = new PrismaClient();

  let category = await prisma.category.findUnique({
    where: { slug: "backend-architecture" },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        slug: "backend-architecture",
        name: "后端架构",
        tone: "blue",
        summary: "Java 后端、微服务、系统设计",
        heroTitle: "后端架构与系统设计",
        longSummary: "深入探讨 Java 后端开发、微服务架构、分布式系统等话题。",
        curatorNote: "关注代码质量与系统稳定性",
        focusAreas: ["Java", "Spring Boot", "微服务", "系统设计"],
        sortOrder: 10,
      },
    });
  }

  const blocks = [
    {
      id: randomId(),
      type: "paragraph",
      text: `本文受启发于 2024 年 4 月在合肥举行的开发者内部分享会。`,
      style: { textAlign: "center", fontStyle: "italic" }
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `前排提示：文章后半部分包含关于深入底层架构的硬核代码逻辑，请配合杯上一口热咖啡阅读。`,
      style: { textAlign: "center", fontStyle: "italic" }
    },
    {
      id: randomId(),
      type: "divider"
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `我听过太多关于 AI 取代程序员的论调了。但不幸地是，这依旧是一篇关于 AI 编程的文章。`
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `作为一名长期在 JVM 虚拟机和复杂的微服务架构中摸爬滚打的后端工程师，我一直试图想弄明白：如何在不感到沮丧的前提下拥抱生成式 AI 工具？我们习惯了强类型、编译校验以及严格的设计模式。我们的世界是严谨且确定的。然而，我既对 AI 能做到的事情感到迷恋，又对它有时候生成的劣质代码感到厌恶，同时还对那些宣扬它可以解决一切的狂热信徒保持警惕。但在今天，"Vibe Coding" 的出现，正在改变我对待编程的态度。`
    },
    {
      id: randomId(),
      type: "image",
      url: "/images/fc-blur.jpg",
      alt: "A developer deep in thought",
      caption: "专注的开发者状态",
      layout: "normal"
    },
    {
      id: randomId(),
      type: "heading",
      level: 2,
      text: `把 AI 当成一种乐器，而不是一种代工`
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `Vibe Coding 不仅仅是编写代码，它更像是一种"心流"状态。在人工智能工具（如 GitHub Copilot 或 Cursor）的辅助下，我们不再纠结于具体的语法细节，而是将重心放在系统的宏观逻辑和"气质"上。如果把它看成是一件乐器（Instrument）的话，你的编程水平和对代码美学的追求决定了你能吹出怎样的曲调。`
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `想象一下，你只需要描述你的想法，代码就像泉水一样自然流淌。这种感觉非常奇妙，它让编程从一种枯燥的生产活动变成了一种充满创造性的表达。在这个状态下，这并不是所谓的偷懒，而是你凭借数十年的本能去进行引导（Prompt）。`
    },
    {
      id: randomId(),
      type: "heading",
      level: 2,
      text: `Java 开发者的转型`
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `在 Java 世界里，我们往往需要编写大量的样板代码（Boilerplate Code）。虽然有了 Lombok 和 Java 17+ 的新特性，但复杂度依然存在。通过 Vibe Coding，我们可以快速构建原型，验证某些复杂的并发逻辑，甚至让 AI 帮我们自动纠正那些隐藏在深度嵌套中的 Bug。`
    },
    {
      id: randomId(),
      type: "code",
      code: `// 这是一个经典的 Spring Boot 异步处理与 AI 协作示例
@Service
public class VibeService {
    private final AIAssistantClient aiClient;

    public VibeService(AIAssistantClient aiClient) {
        this.aiClient = aiClient;
    }

    @Async
    public CompletableFuture<String> doWork(String context) {
        // 让 AI 帮助我们生成基础的业务逻辑框架
        String generatedLogic = aiClient.prompt("根据以下上下文，生成优化后的处理流：" + context);

        // 开发者此时只需评审并应用业务规则的边界验证
        if(isValid(generatedLogic)) {
            return CompletableFuture.completedFuture("Vibe Flow Processed: " + generatedLogic);
        }

        return CompletableFuture.failedFuture(new IllegalVibeException("The vibe is off."));
    }
}`,
      language: "java"
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `有些人担心这会导致代码质量下降。但我的经验刚好相反。当我们从繁琐的语法束缚中解脱出来，我们反而有更多的时间去思考如何设计更稳健的系统架构，如何处理极端的边界情况。代码的"Vibe"——也就是它的设计美学和可读性——实际上得到了显著提升。因为时间并没有被节省下来，而是花在了更高维度的事情上。`
    },
    {
      id: randomId(),
      type: "quote",
      text: `无论是一把锋利的刀柄还是一把钝了的长矛，最终决胜的关键依然在于握着它的那双手。`
    },
    {
      id: randomId(),
      type: "heading",
      level: 2,
      text: `来自合肥的思考与重构`
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `在合肥这座"科里科气"的科技之城中，创新与实干精神无处不在。Vibe Coding 对我来说，是在严谨的后端逻辑与奔放的创造力之间找到的一种平衡。`
    },
    {
      id: randomId(),
      type: "paragraph",
      text: `如果你还没试过，我建议你暂时放下手中的《Java 编程思想》，打开 Cursor，尝试跟随着你的直觉（Vibe）去写一段代码，不要怕犯错，去容忍那些奇怪的代码块，然后在错误的碰撞中找寻灵感。你会发现，编程原来可以如此有趣，并且超越了机器本身。`
    }
  ];

  const article = await prisma.article.create({
    data: {
      slug: "vibe-coding-for-java-developers",
      title: "为什么 Java 后端开发者也应该尝试 Vibe Coding？",
      excerpt: "关于在严谨逻辑中寻找心流状态的思考",
      lede: "作为一名 Java 后端工程师，我在 AI 辅助编程中找到了新的平衡点。",
      kind: "ORIGINAL",
      status: "PUBLISHED",
      tone: "blue",
      readingTime: "8 分钟",
      authorDisplayName: "Alex Plum",
      authorRoleLabel: "Java 后端开发",
      highlights: [
        "把 AI 当成乐器，而不是代工工具",
        "Vibe Coding 让我们专注于系统设计而非语法细节",
        "在严谨与创造力之间找到平衡"
      ],
      contentBlocks: blocks,
      publishedAt: new Date("2024-04-15"),
      categoryId: category.id,
      coverUrl: "/images/fc-blur.jpg"
    }
  });

  console.log("✅ 创建文章成功:", article.slug);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


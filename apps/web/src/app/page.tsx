import { CategoryLibrary } from "@/components/home/category-library";
import { CreatorAtelier } from "@/components/home/creator-atelier";
import { EditorialBand } from "@/components/home/editorial-band";
import { HeroShowcase } from "@/components/home/hero-showcase";
import { SiteHeader } from "@/components/site-header";
import { getHomePageData } from "@/lib/public-api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const home = await getHomePageData();
  const usesPrototypeMinimalGlow = home.issue.logoVariant === "prototype-minimal-glow";

  return (
    <main className="gallery">
      <section className={`board board-d home-shell${usesPrototypeMinimalGlow ? " board--prototype-minimal-glow" : ""}`}>
        {usesPrototypeMinimalGlow ? <div className="aurora aurora-a1" /> : <div className="aurora aurora-d1" />}
        {usesPrototypeMinimalGlow ? <div className="aurora aurora-a2" /> : <div className="aurora aurora-d2" />}
        {!usesPrototypeMinimalGlow ? <div className="aurora aurora-d3" /> : null}
        <SiteHeader />
        <HeroShowcase issue={home.issue} featuredStories={home.featuredStories} stats={home.siteStats} />
        <section className="curated-shell">
          <CategoryLibrary topics={home.topicShelves} />
          <CreatorAtelier
            tools={home.creatorTools}
            topicCount={home.topicShelves.length}
            categoryCoverLibrary={home.categoryCoverLibrary}
          />
        </section>
        <EditorialBand
          essays={home.latestEssays}
          logs={home.readingLogs}
          about={{
            intro: "这里写原创，也收录外部技术文章，把读到的东西慢慢译成自己的知识版图。",
            currentTheme: home.issue.eyebrow.replace(/^XBlog\s*\/\s*/, "") || "Aurora Edition",
            updateStatus: home.readingLogs[0]
              ? `最近更新：${home.readingLogs[0].title}`
              : "最近在补新的摘要、分类说明和首页这一期的策展。",
            metrics: [
              `${home.topicShelves.length} 个分类分区`,
              `${home.categoryCoverLibrary.total} 张封面素材`,
              `${home.readingLogs.length} 条近期收录`,
            ],
          }}
        />
      </section>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { adminAppUrl } from "@/lib/site-links";
import type { CategoryCoverPreview, CreatorTool } from "@/lib/view-models";

type CreatorAtelierProps = {
  tools: CreatorTool[];
  topicCount: number;
  categoryCoverLibrary: {
    total: number;
    items: CategoryCoverPreview[];
  };
};

function previewCountForTopics(topicCount: number, total: number) {
  const rows = Math.max(2, Math.ceil(topicCount / 2));
  return Math.min(total, Math.max(6, rows * 2));
}

export function CreatorAtelier({
  tools,
  topicCount,
  categoryCoverLibrary,
}: CreatorAtelierProps) {
  const previewCount = previewCountForTopics(topicCount, categoryCoverLibrary.items.length);
  const previewItems = categoryCoverLibrary.items.slice(0, previewCount);

  return (
    <aside id="atelier" className="atelier card glass">
      <div className="section-head">
        <h2>创作工作台</h2>
        <span className="soft-link">写作与收录在这里并桌而坐</span>
      </div>

      <p>
        写作、草稿、收录整理和分类维护，都被安放在同一处，
        让内容不再四散，而是沿着一条清楚的路径慢慢成形。
      </p>

      <div className="atelier-list">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="atelier-item atelier-item-link"
          >
            <div className="atelier-icon">{tool.badge}</div>
            <div>
              <strong>{tool.title}</strong>
              <p>{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <section className="cover-library-panel">
        <div className="cover-library-head">
          <div>
            <span className="atelier-step">封面素材库</span>
            <h3>把分类封面也一起收入这张长桌。</h3>
          </div>
          <Link href={`${adminAppUrl}/category-cover-assets`} className="cover-library-more">
            更多素材
          </Link>
        </div>
        <p>
          现在已经收回 {categoryCoverLibrary.total} 张可复用素材。新分类可以手动挑，也能在空着的时候等系统替它认领。
        </p>
        {previewItems.length > 0 ? (
          <div className="cover-library-grid">
            {previewItems.map((asset) => (
              <div key={asset.id} className="cover-library-thumb">
                <Image
                  alt="分类封面素材预览"
                  fill
                  sizes="(max-width: 1100px) 100vw, 20vw"
                  src={asset.url}
                  unoptimized
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="cover-library-empty">
            <span className="meta-line">素材库还空着。暂时没有封面的分类，会先披上一层渐变夜色。</span>
          </div>
        )}
      </section>
    </aside>
  );
}

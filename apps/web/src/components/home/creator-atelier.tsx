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
        <span className="soft-link">统一管理写作与收录</span>
      </div>

      <p>
        把写作、草稿、收录整理、分类维护固定在同一个稳定位置，
        避免像旧博客那样入口分散、逻辑跳跃。
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
            <h3>把分类封面素材也固定进工作台。</h3>
          </div>
          <Link href={`${adminAppUrl}/category-cover-assets`} className="cover-library-more">
            更多素材
          </Link>
        </div>
        <p>
          当前已收集 {categoryCoverLibrary.total} 张可复用素材。新增分类时可以直接选，也能在没手动指定时自动分配。
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
            <span className="meta-line">素材库还没有图片，新的未配置分类会先回退到纯渐变封面。</span>
          </div>
        )}
      </section>
    </aside>
  );
}

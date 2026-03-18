import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="admin-login-page">
      <div className="admin-login-shell">
        <section className="admin-card admin-login-hero">
          <p className="admin-kicker">Editorial Core</p>
          <h1>进入 XBlog 内容工作台</h1>
          <p className="admin-subtle admin-login-description">
            用和公开站一致的深海底板、玻璃面板和极光层次来管理文章、刊期、对象存储与机器令牌。
          </p>

          <div className="admin-hero-meta">
            <span className="admin-chip">文章与分类统一维护</span>
            <span className="admin-chip">Prisma + PostgreSQL</span>
            <span className="admin-chip">MinIO 预签名上传</span>
          </div>

          <div className="admin-grid cols-3">
            <div className="admin-card admin-mini-stat">
              <span className="admin-mini-stat-label">Flow</span>
              <strong>Publish</strong>
              <p className="admin-subtle">创建、编辑、发布与隐藏在一处完成。</p>
            </div>
            <div className="admin-card admin-mini-stat">
              <span className="admin-mini-stat-label">Storage</span>
              <strong>Probe</strong>
              <p className="admin-subtle">上传探针和诊断页可直接在浏览器里联调。</p>
            </div>
            <div className="admin-card admin-mini-stat">
              <span className="admin-mini-stat-label">Issue</span>
              <strong>Curate</strong>
              <p className="admin-subtle">首页主精选与侧卡策展在刊期面板里统一控制。</p>
            </div>
          </div>
        </section>

        <LoginForm />
      </div>
    </div>
  );
}

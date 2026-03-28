import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="admin-login-page">
      <div className="admin-login-shell">
        <section className="admin-card admin-login-hero">
          <p className="admin-kicker">Editorial Core</p>
          <h1>进入 XBlog 内容工作台</h1>
          <p className="admin-subtle admin-login-description">
            从这里回到内容后台。文章、刊期、对象存储与机器令牌，会在和公开站相同的夜色里排开。
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
              <p className="admin-subtle">起稿、修订、发布与收回，都沿着同一条线往前走。</p>
            </div>
            <div className="admin-card admin-mini-stat">
              <span className="admin-mini-stat-label">Storage</span>
              <strong>Probe</strong>
              <p className="admin-subtle">上传探针与诊断结果都留在浏览器里，不必再折回终端确认。</p>
            </div>
            <div className="admin-card admin-mini-stat">
              <span className="admin-mini-stat-label">Issue</span>
              <strong>Curate</strong>
              <p className="admin-subtle">首页这一期的主精选与侧卡，会在刊期面板里一起定下语气。</p>
            </div>
          </div>
        </section>

        <LoginForm />
      </div>
    </div>
  );
}

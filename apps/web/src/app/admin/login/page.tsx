import { LoginForm } from "@/components/admin/login-form";

export default function LoginPage() {
  return (
    <div className="admin-app admin-login-page">
      <div className="admin-login-shell">
        <aside className="admin-login-brand">
          <div className="admin-brand-content">
            <div className="vibe-seal-outer" style={{ width: '120px', height: '120px', borderRadius: '0', clipPath: 'polygon(10% 0, 100% 15%, 90% 100%, 0 85%)' }}>
              <img src="/images/logo.png" alt="XBlog Logo" style={{ width: '80px', height: '80px' }} />
            </div>
            <strong>XBLOG</strong>
            <p style={{ background: '#D50000', color: '#fff', padding: '0.5rem 1rem', transform: 'rotate(2deg)' }}>PHANTOM EDITORIAL CORE</p>
          </div>
        </aside>

        <main className="admin-login-main">
          <div className="admin-login-form-container">
            <LoginForm />
          </div>
        </main>
      </div>
    </div>
  );
}


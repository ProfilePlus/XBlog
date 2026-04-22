import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="admin-login-page">
      <div className="admin-login-shell">
        <aside className="admin-login-brand">
          <div className="admin-brand-content">
            <strong>XBlog</strong>
            <p>Editorial Core Console</p>
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

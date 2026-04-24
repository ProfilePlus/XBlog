"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const result = await loginAction(formData);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form className="admin-form admin-login-form" onSubmit={handleSubmit}>
      <div style={{ marginBottom: '2rem' }}>
        <p className="admin-kicker">身份验证</p>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-serif)' }}>管理员登录</h2>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: 'rgba(255, 77, 77, 0.1)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid var(--color-danger)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          电子邮箱
          <input 
            name="email"
            type="email" 
            defaultValue="alexplum405@gmail.com"
            placeholder="your@email.com"
            required
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          安全密码
          <input 
            name="password"
            type="password" 
            placeholder="••••••••"
            required
          />
        </label>
      </div>

      <button className="admin-primary-button" style={{ width: '100%' }} type="submit" disabled={pending}>
        {pending ? "正在验证身份..." : "进入控制台"}
      </button>
    </form>
  );
}

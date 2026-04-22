"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminConfig } from "@/lib/config";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@xblog.local");
  const [password, setPassword] = useState("admin12345");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch(`${adminConfig.apiBaseUrl}/v1/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      setError("这次没能进来，看看邮箱或密码是不是写错了。");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="admin-form admin-login-form" onSubmit={handleSubmit}>
      <div style={{ marginBottom: '2rem' }}>
        <p className="admin-kicker">Welcome Back</p>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>Sign In</h2>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
          Email Address
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@xblog.local"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
          Password
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>
      </div>

      <button className="admin-primary-button" style={{ width: '100%', padding: '0.875rem' }} type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Continue to Console"}
      </button>
    </form>
  );
}

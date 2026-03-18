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
      setError("登录失败，请检查邮箱或密码。");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className="admin-card admin-form admin-login-form" onSubmit={handleSubmit}>
      <div className="admin-section-head">
        <div>
          <p className="admin-kicker">Sign In</p>
          <h2>登录内容后台</h2>
        </div>
      </div>
      <p className="admin-subtle">本地环境已预填默认账号，你也可以改成自己的后台账号后再进入。</p>
      <label>
        邮箱
        <input
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        密码
        <input
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p className="admin-error">{error}</p> : null}
      <button className="admin-primary-button admin-full-button" type="submit" disabled={pending}>
        {pending ? "登录中..." : "进入后台"}
      </button>
      <p className="admin-subtle admin-login-footnote">
        登录后可直接继续管理文章、分类、刊期、存储与 OpenClaw 机器令牌。
      </p>
    </form>
  );
}

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
    <form className="admin-card admin-form admin-login-form" onSubmit={handleSubmit}>
      <div className="admin-section-head">
        <div>
          <p className="admin-kicker">Sign In</p>
          <h2>登录内容后台</h2>
        </div>
      </div>
      <button className="admin-primary-button admin-full-button" type="submit" disabled={pending}>
        {pending ? "正在入场..." : "进入后台"}
      </button>
      <p className="admin-subtle admin-login-footnote">
        进去之后，文章、分类、刊期、存储和 OpenClaw 的写入令牌都会在同一张桌面上等你。
      </p>
    </form>
  );
}

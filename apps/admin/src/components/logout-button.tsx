"use client";

import { useRouter } from "next/navigation";
import { adminConfig } from "@/lib/config";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch(`${adminConfig.apiBaseUrl}/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="admin-ghost-button" onClick={handleLogout} type="button">
      退出登录
    </button>
  );
}

"use server";

import { cookies } from "next/headers";
import { adminConfig } from "@/lib/config";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const response = await fetch(`${adminConfig.apiBaseUrl}/v1/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    return { error: "登录失败，请检查账号密码。" };
  }

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    // 提取 xblog_admin_session 的值
    const match = setCookie.match(/xblog_admin_session=([^;]+)/);
    if (match) {
      const cookieStore = await cookies();
      cookieStore.set("xblog_admin_session", match[1], {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
    }
  }

  return { success: true };
}

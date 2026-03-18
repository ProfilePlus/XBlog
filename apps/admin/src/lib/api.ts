import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { adminConfig } from "@/lib/config";

export async function apiFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");

  return fetch(`${adminConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function getAdminUserOrRedirect() {
  const response = await apiFetch("/v1/auth/me");
  if (!response.ok) {
    redirect("/login");
  }

  const payload = await response.json();
  return payload.user as {
    id: string;
    email: string;
    displayName: string;
  };
}

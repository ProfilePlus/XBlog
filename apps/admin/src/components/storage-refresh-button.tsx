"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function StorageRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="admin-ghost-button"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    >
      {isPending ? "检查中..." : "重新检查"}
    </button>
  );
}

import { expect, test } from "@playwright/test";

test("renders the category overview page", async ({ page }) => {
  await page.goto("/categories");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "按分类进入 XBlog 的知识版图。",
  );
  await expect(page.getByRole("heading", { name: "前端交互" })).toBeVisible();
  await expect(page.getByRole("link", { name: "进入 前端交互" })).toBeVisible();
});

test("renders an article detail page with related reading", async ({ page }) => {
  await page.goto("/articles/curate-external-articles");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "如何把外部好文章收录成自己的知识资产",
  );
  await expect(page.getByRole("heading", { name: "文章摘要" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "继续阅读" })).toBeVisible();
  await expect(page.locator(".related-list .related-link").first()).toBeVisible();
});

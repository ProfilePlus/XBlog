import { expect, test } from "@playwright/test";

test("renders the D homepage shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "让技术、阅读与沉淀，在同一片极光里发光。",
  );
  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "分类书架" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "创作工作台" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "收录日志" })).toBeVisible();
});

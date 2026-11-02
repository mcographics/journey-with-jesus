import { expect, test } from "@playwright/test";

test("home and media are the only primary destinations, with working story CTA", async ({ page }) => {
  await page.goto("/");
  const masthead = page.getByRole("img", { name: /Journey with Jesus illustrated banner/ });
  await expect(masthead).toBeVisible();
  await expect.poll(() => masthead.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(6144);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Journey");
  await expect(page.getByText("These are more than themes. They are at the heart of the journey.")).toBeVisible();
  await expect(page.getByText("Journey with Jesus brings biblical narratives to life", { exact: false })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link")).toHaveCount(2);
  await page.getByRole("link", { name: "Watch the Stories" }).click();
  await expect(page).toHaveURL(/\/media\/$/);
  await expect(page.getByRole("heading", { name: "Animated stories of faith." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coming Soon" })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
});

test("the mobile navigation opens and the layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const masthead = page.getByRole("img", { name: /Journey with Jesus illustrated banner/ });
  await expect(masthead).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Media" })).toBeVisible();
  await page.getByRole("link", { name: "Media", exact: true }).click();
  await expect(page).toHaveURL(/\/media\/$/);
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});

test("desktop media page fits the player and playlist without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/media/");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("complementary", { name: "Story playlist" })).toBeVisible();
});

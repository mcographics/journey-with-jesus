import { expect, test } from "@playwright/test";

test("page-to-page navigation keeps working from the public footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Enter Site" }).click();
  await expect(page).toHaveURL(/\/company\/$/);
  await expect(page.locator("main#main-content")).toBeVisible();

  for (const href of [
    "/projects/journey-with-jesus/",
    "/media/",
    "/team/",
    "/company/",
  ]) {
    await page.locator(`footer .footer-links a[href="${href}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, "\\/")}$`));
    await expect(page.locator("main#main-content")).toBeVisible();
  }
});

test("returning to a Bible translation reuses its loaded text", async ({ page }) => {
  const kjvRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/scripture/kjv.json")) {
      kjvRequests.push(request.url());
    }
  });

  await page.goto("/word/");
  await expect(page.locator("#word-verse-1")).toBeVisible();

  const selector = page.getByRole("combobox", { name: "Bible translation" });
  await selector.selectOption("ASV");
  await expect(page.locator(".word-reading-heading > p")).toContainText("American Standard Version");
  await expect(page.locator("#word-verse-1")).toBeVisible();

  await selector.selectOption("KJV");
  await expect(page.locator(".word-reading-heading > p")).toContainText("King James Version");
  await expect(page.locator("#word-verse-1")).toBeVisible();
  expect(kjvRequests).toHaveLength(1);
});

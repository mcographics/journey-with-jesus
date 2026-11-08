import { expect, test } from "@playwright/test";

test("French language selection switches the Journey with Jesus masthead wordmark", async ({ page }) => {
  await page.goto("/projects/journey-with-jesus/");
  const wordmark = page.locator(".home-masthead-wordmark-image");

  await expect.poll(() => wordmark.evaluate((image) => (image as HTMLImageElement).currentSrc))
    .toMatch(/journey-with-jesus-wordmark-640\.webp$/);

  await page.locator(".site-language-toggle").click();
  await page.getByRole("option", { name: "Français [FR]" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(wordmark).toHaveAttribute("alt", "Voyage avec Jésus");
  await expect.poll(() => wordmark.evaluate((image) => (image as HTMLImageElement).currentSrc))
    .toMatch(/journey-with-jesus-wordmark-fr-(320|640|960)\.png$/);

  await page.locator(".site-language-toggle").click();
  await page.locator(".site-language-option").first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(wordmark).toHaveAttribute("alt", "Journey with Jesus");
  await expect.poll(() => wordmark.evaluate((image) => (image as HTMLImageElement).currentSrc))
    .toMatch(/journey-with-jesus-wordmark-640\.webp$/);
});

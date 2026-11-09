import { expect, test } from "@playwright/test";

test("French and Spanish selections use their localized Journey with Jesus masthead wordmarks", async ({ page }) => {
  await page.goto("/projects/journey-with-jesus/");
  const wordmark = page.locator(".home-masthead-wordmark-image");

  await expect.poll(() => wordmark.evaluate((image) => (image as HTMLImageElement).currentSrc))
    .toMatch(/journey-with-jesus-wordmark-640\.webp$/);

  await page.mouse.move(page.viewportSize()!.width - 3, 35);
  await expect(page.locator(".desktop-utility-drawer")).toHaveClass(/is-open/);
  await page.locator(".site-language-toggle").click();
  await page.getByRole("option", { name: "Français [FR]" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(wordmark).toHaveAttribute("alt", "Voyage avec Jésus");
  await expect.poll(() => wordmark.evaluate((image) => (image as HTMLImageElement).currentSrc))
    .toMatch(/journey-with-jesus-wordmark-fr-(320|640|960)\.png$/);

  await page.locator(".site-language-toggle").click();
  await page.getByRole("option", { name: "Español [ES]" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(wordmark).toHaveAttribute("alt", "Viaje con Jesús");
  await expect.poll(() => wordmark.evaluate((image) => (image as HTMLImageElement).currentSrc))
    .toMatch(/journey-with-jesus-wordmark-es-(320|640|960)\.png$/);

  await page.locator(".site-language-toggle").click();
  await page.locator(".site-language-option").first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(wordmark).toHaveAttribute("alt", "Journey with Jesus");
  await expect.poll(() => wordmark.evaluate((image) => (image as HTMLImageElement).currentSrc))
    .toMatch(/journey-with-jesus-wordmark-640\.webp$/);
});

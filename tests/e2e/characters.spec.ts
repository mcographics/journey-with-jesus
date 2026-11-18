import { expect, test } from "@playwright/test";

test("David follows Samson in the responsive character catalogue", async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/characters/");
    await expect(page.getByRole("heading", { name: "Meet the Characters" })).toBeVisible();

    const cards = page.locator(".character-card");
    const names = await cards.locator(".character-card-copy h2").allTextContents();
    const samsonIndex = names.indexOf("Samson");
    const davidIndex = names.indexOf("David");
    expect(davidIndex).toBe(samsonIndex + 1);

    const samson = cards.nth(samsonIndex);
    const david = cards.nth(davidIndex);
    const samsonBox = await samson.boundingBox();
    const davidBox = await david.boundingBox();
    expect(samsonBox).not.toBeNull();
    expect(davidBox).not.toBeNull();
    if (!samsonBox || !davidBox) throw new Error("Character cards must be visible in the catalogue.");

    if (viewport.width > 700) {
      expect(Math.abs(samsonBox.y - davidBox.y)).toBeLessThan(2);
      expect(davidBox.x).toBeGreaterThan(samsonBox.x);
    } else {
      expect(Math.abs(samsonBox.x - davidBox.x)).toBeLessThan(2);
      expect(davidBox.y).toBeGreaterThan(samsonBox.y);
    }

    const portrait = david.locator("img.character-portrait-image");
    await expect(portrait).toHaveAttribute("src", /david-portrait\.webp$/);
    await expect.poll(() => portrait.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
});

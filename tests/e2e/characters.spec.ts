import { expect, test } from "@playwright/test";

test("David and the Apostle John follow the catalogue order on desktop and mobile", async ({ page }) => {
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
    const apostleJohnIndex = names.indexOf("John the Apostle");
    const johnTheBaptistIndex = names.indexOf("John the Baptist");
    expect(davidIndex).toBe(samsonIndex + 1);
    expect(apostleJohnIndex).toBe(davidIndex + 1);
    expect(johnTheBaptistIndex).toBe(apostleJohnIndex + 1);

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
    expect(await portrait.evaluate((image) => getComputedStyle(image).objectFit)).toBe("cover");
    const apostleJohn = cards.nth(apostleJohnIndex);
    const johnPortrait = apostleJohn.locator("img.character-portrait-image");
    await expect(johnPortrait).toHaveAttribute("src", /john-apostle-portrait\.webp$/);
    await expect.poll(() => johnPortrait.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await johnPortrait.evaluate((image) => getComputedStyle(image).objectFit)).toBe("cover");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
});

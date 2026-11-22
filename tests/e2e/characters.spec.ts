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
    const maryYu = cards.filter({ has: page.locator(".character-portrait-name-label", { hasText: "Mary Yu" }) });
    await expect(maryYu).toHaveCount(1);
    await expect(cards.last().locator(".character-portrait-name-label")).toHaveText("Mary Yu");
    await expect(maryYu.locator(".character-portrait-name-label")).toHaveText("Mary Yu");
    await expect(maryYu.locator(".character-card-copy")).toHaveCount(0);
    const maryPortrait = maryYu.locator("img.character-portrait-image");
    await expect(maryPortrait).toHaveAttribute("src", /mary-yu-portrait\.webp$/);
    await expect(maryPortrait).toHaveAttribute("alt", "Mary Yu");
    await expect.poll(() => maryPortrait.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await maryPortrait.evaluate((image) => getComputedStyle(image).objectFit)).toBe("cover");
    expect(await maryPortrait.evaluate((image) => getComputedStyle(image).objectPosition)).toBe("50% 50%");
    const maryBox = await maryYu.boundingBox();
    expect(maryBox).not.toBeNull();
    if (!maryBox) throw new Error("Mary Yu's portrait card must be visible in the catalogue.");
    expect(maryBox.width / maryBox.height).toBeCloseTo(941 / 1908, 3);
    await expect(maryYu.locator("source[type='image/webp']")).toHaveAttribute("srcset", /mary-yu-portrait-480\.webp 480w.*mary-yu-portrait-720\.webp 720w.*mary-yu-portrait-941\.webp 941w/);

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

import { expect, test } from "@playwright/test";

test("home and media are the only primary destinations, with working story CTA", async ({ page }) => {
  await page.goto("/");
  const masthead = page.getByRole("img", { name: /Journey with Jesus illustrated banner/ });
  await expect(masthead).toBeVisible();
  await expect.poll(() => masthead.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect.poll(() => masthead.evaluate((image) => (image as HTMLImageElement).currentSrc)).toMatch(/journey-with-jesus-header-\d+\.webp$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Journey");
  await expect(page.getByText("These are more than themes. They are at the heart of the journey.")).toBeVisible();
  await expect(page.getByText("Journey with Jesus brings biblical narratives to life", { exact: false })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link")).toHaveCount(2);
  await page.getByRole("link", { name: "Watch the Stories" }).click();
  await expect(page).toHaveURL(/\/media\/$/);
  await expect(page.getByRole("heading", { name: "Animated stories of faith." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coming Soon" })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  const footerBrand = page.getByRole("link", { name: "Journey with Jesus home" });
  await expect(footerBrand.locator('picture source[type="image/webp"]')).toHaveAttribute("srcSet", /footer-wordmark-transparent-420\.webp/);
  await expect(footerBrand.locator("img")).toHaveAttribute("src", /footer-wordmark-fallback\.png/);
  const footerNavigation = page.getByRole("navigation", { name: "Footer navigation" });
  await expect(footerNavigation.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(footerNavigation.getByRole("link", { name: "Media" })).toBeVisible();
});

test.describe("touch mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test("the floating menu auto-hides after scrolling, stays accessible, and opens Home and Media", async ({ page }) => {
    await page.goto("/");
    const masthead = page.getByRole("img", { name: /Journey with Jesus illustrated banner/ });
    await expect(masthead).toBeVisible();
    const menuButton = page.locator(".mobile-menu-toggle");
    await expect(menuButton).toBeVisible();
    const mobileNavigation = page.locator(".mobile-navigation");
    await expect(mobileNavigation).toHaveCSS("opacity", "0", { timeout: 3000 });

    await page.evaluate(() => window.scrollTo(0, 240));
    await page.waitForFunction(() => window.scrollY >= 240);
    await expect(mobileNavigation).toHaveCSS("opacity", "1");
    const initialButtonPosition = await menuButton.boundingBox();
    expect(initialButtonPosition).not.toBeNull();
    await page.evaluate(() => window.scrollTo(0, 480));
    await page.waitForFunction(() => window.scrollY >= 480);
    const scrolledButtonPosition = await menuButton.boundingBox();
    expect(scrolledButtonPosition?.y).toBeCloseTo(initialButtonPosition!.y, 0);
    await expect(mobileNavigation).toHaveCSS("opacity", "0", { timeout: 3000 });

    await menuButton.focus();
    await expect(mobileNavigation).toHaveCSS("opacity", "1");

    const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(navigation).toBeHidden();
    await menuButton.click();
    await expect(navigation).toBeVisible();
    await menuButton.evaluate((button) => button.blur());
    await page.waitForTimeout(1100);
    await expect(mobileNavigation).toHaveCSS("opacity", "1");
    await expect(navigation.getByRole("link", { name: "Home" })).toBeVisible();
    const mediaLink = navigation.getByRole("link", { name: "Media" });
    await expect(mediaLink).toBeVisible();
    await mediaLink.click();
    await expect(page).toHaveURL(/\/media\/$/);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

    await page.setViewportSize({ width: 768, height: 812 });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForFunction(() => window.scrollY >= 100);
    await expect(mobileNavigation).toHaveCSS("opacity", "1");

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const storySeal = page.getByRole("link", { name: /Click Me!/ });
    await expect(storySeal).toBeVisible();
    await storySeal.scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator(".storybook-background").evaluate((image) => (image as HTMLImageElement).currentSrc)).toMatch(/scripture-city-story-mobile-\d+\.webp$/);
    await storySeal.click();
    await expect(page).toHaveURL(/\/media\/$/);
  });
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

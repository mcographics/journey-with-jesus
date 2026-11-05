import { expect, test } from "@playwright/test";

test("public destinations are available in the desktop menu, with working story CTA", async ({ page }) => {
  await page.goto("/");
  const masthead = page.getByRole("img", { name: /Jesus walks with a young man/ });
  await expect(masthead).toBeVisible();
  await expect(masthead).toHaveAttribute("width", "6384");
  await expect(masthead).toHaveAttribute("height", "2736");
  await expect.poll(() => masthead.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect.poll(() => masthead.evaluate((image) => (image as HTMLImageElement).currentSrc)).toMatch(/journey-with-jesus-header-\d+\.webp$/);
  const revealResponse = page.waitForResponse((response) =>
    response.url().endsWith("/images/header-easter-egg-2560.webp") && response.ok(),
  );
  const mastheadBounds = await page.locator(".home-masthead").boundingBox();
  expect(mastheadBounds).not.toBeNull();
  await page.mouse.move(
    mastheadBounds!.x + mastheadBounds!.width / 2,
    mastheadBounds!.y + mastheadBounds!.height / 2,
  );
  await revealResponse;
  await expect(page.locator(".masthead-easter-egg-canvas")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Journey");
  await expect(page.getByText("These are more than themes. They are at the heart of the journey.")).toBeVisible();
  await expect(page.getByText("Journey with Jesus brings biblical narratives to life", { exact: false })).toBeVisible();
  const desktopMenuButton = page.getByRole("button", { name: "Open site menu" });
  await expect(desktopMenuButton).toBeVisible();
  await desktopMenuButton.click();
  const primaryNavigation = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(primaryNavigation).toBeVisible();
  await expect(primaryNavigation.getByRole("link")).toHaveCount(5);
  for (const destination of ["Home", "Media", "Meet the Characters", "Meet the Team", "Store"]) {
    await expect(primaryNavigation.getByRole("link", { name: destination })).toBeVisible();
  }
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
    const masthead = page.getByRole("img", { name: /Jesus walks with a young man/ });
    await expect(masthead).toBeVisible();
    const menuButton = page.locator(".mobile-menu-toggle");
    await expect(menuButton).toBeVisible();
    await expect(page.locator(".desktop-menu-toggle")).toBeHidden();
    await expect(menuButton).toHaveText("");
    await expect(menuButton.locator("svg")).toBeVisible();
    const mobileNavigation = page.locator(".mobile-navigation");
    await expect(mobileNavigation).toHaveCSS("opacity", "0", { timeout: 3000 });
    const restingButtonBounds = await menuButton.boundingBox();
    expect(restingButtonBounds).not.toBeNull();
    const viewport = page.viewportSize()!;
    expect(restingButtonBounds!.y + restingButtonBounds!.height / 2).toBeCloseTo(viewport.height / 2, 0);
    expect(restingButtonBounds!.x + restingButtonBounds!.width).toBeCloseTo(viewport.width - 16, 0);

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
    const openButtonPosition = await menuButton.boundingBox();
    expect(openButtonPosition?.y).toBeCloseTo(initialButtonPosition!.y, 0);
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

test("Upper Room dark mode uses soft-white text", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/studio/");

  const studioTitle = page.locator(".studio-page h1").first();
  const studioCopy = page.locator(".studio-page p").first();
  await expect(studioTitle).toBeVisible();
  await expect(studioTitle).toHaveCSS("color", "rgb(229, 231, 235)");
  await expect(studioTitle).toHaveCSS("text-shadow", "none");
  await expect(studioCopy).toHaveCSS("color", "rgb(229, 231, 235)");
});

test("Media, Characters, Team, and Store dark mode use soft-white text", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });

  for (const { route, selector } of [
    { route: "/media/", selector: ".media-page" },
    { route: "/characters/", selector: ".characters-page" },
    { route: "/team/", selector: ".team-page" },
    { route: "/store/", selector: ".store-page" },
  ]) {
    await page.goto(route);
    const title = page.locator(`${selector} h1`).first();
    const copy = page.locator(`${selector} p`).first();
    await expect(title).toBeVisible();
    await expect(title).toHaveCSS("color", "rgb(229, 231, 235)");
    await expect(title).toHaveCSS("text-shadow", "none");
    await expect(copy).toHaveCSS("color", "rgb(229, 231, 235)");
  }
});

test("all five policy pages use flat theme-specific text colors", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });

  const policySlugs = ["privacy", "terms", "community-guidelines", "cookies", "copyright"];
  for (const slug of policySlugs) {
    await page.goto(`/policies/${slug}/`);
    const policy = page.locator("#main-content.legal-policy-page");
    const title = policy.locator("h1");
    const sectionTitle = policy.locator("h2").first();
    const bodyCopy = policy.locator("section p").first();
    const subordinateText = [bodyCopy, policy.locator("strong").first(), policy.locator("a").first()];

    await expect(title).toBeVisible();
    await expect(sectionTitle).toBeVisible();
    for (const heading of [title, sectionTitle]) {
      await expect(heading).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(heading).toHaveCSS("-webkit-text-fill-color", "rgb(255, 255, 255)");
      await expect(heading).toHaveCSS("text-shadow", "none");
      await expect(heading).toHaveCSS("background-image", "none");
      await expect(heading).toHaveCSS("animation-name", "none");
    }
    for (const copy of subordinateText) {
      await expect(copy).toHaveCSS("color", "rgb(255, 255, 0)");
      await expect(copy).toHaveCSS("-webkit-text-fill-color", "rgb(255, 255, 0)");
      await expect(copy).toHaveCSS("text-shadow", "none");
      await expect(copy).toHaveCSS("background-image", "none");
      await expect(copy).toHaveCSS("animation-name", "none");
    }

    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });
    for (const text of [title, sectionTitle, ...subordinateText]) {
      await expect(text).toHaveCSS("color", "rgb(0, 0, 0)");
      await expect(text).toHaveCSS("-webkit-text-fill-color", "rgb(0, 0, 0)");
      await expect(text).toHaveCSS("text-shadow", "none");
      await expect(text).toHaveCSS("background-image", "none");
      await expect(text).toHaveCSS("animation-name", "none");
    }
  }
});

test("Meet the Team credits the founder and editor/webmaster accurately", async ({ page }) => {
  await page.goto("/team/");
  const teamCards = page.locator(".team-card");
  await expect(teamCards).toHaveCount(2);

  const founderCard = teamCards.nth(0);
  await expect(founderCard.getByRole("heading", { name: "Eric Oberhausen" })).toBeVisible();
  await expect(founderCard.locator(".team-role")).toHaveText("Founder");

  const editorCard = teamCards.nth(1);
  await expect(editorCard.getByRole("heading", { name: "Kenneth Salmon" })).toBeVisible();
  await expect(editorCard.locator(".team-role")).toHaveText("Editor / Webmaster");
});

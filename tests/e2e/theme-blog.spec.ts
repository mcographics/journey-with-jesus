import { expect, test } from "@playwright/test";

test("blog dark mode uses white headings, deep royal-blue gradients and gold-rimmed glass", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/blog/");

  const hero = page.locator(".blog-hero h1");
  const emphasizedTitle = page.locator(".blog-hero h1 em");
  const sectionTitle = page.locator(".blog-section-heading h2");
  const cardTitle = page.locator(".blog-welcome h2").first();

  for (const heading of [hero, emphasizedTitle, sectionTitle, cardTitle]) {
    await expect(heading).toHaveCSS("color", "rgb(249, 251, 255)");
    await expect(heading).toHaveCSS("background-image", "none");
  }

  await expect(page.locator(".blog-page")).toHaveCSS("background-color", "rgb(6, 21, 49)");
  const background = await page.locator(".blog-page").evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(background).toContain("linear-gradient(");
  expect(background).toContain("radial-gradient(");
  const glassCard = page.locator(".blog-welcome").first();
  const cardGradient = await glassCard.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(cardGradient).toContain("linear-gradient(");
  await expect(glassCard).toHaveCSS("backdrop-filter", "blur(16px) saturate(1.35)");
  await expect(page.locator(".blog-topic-card").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.locator(".blog-eyebrow").first()).toHaveCSS("color", "rgb(255, 220, 118)");
  await expect(page.locator(".blog-next-note")).toHaveCSS("border-left-color", "rgb(255, 220, 118)");
  const border = await glassCard.evaluate((node) => getComputedStyle(node).borderTopColor);
  expect(border).toContain("247, 204, 112");
});

test("blog light mode uses light cards and dark readable headings", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "light");
  });
  await page.goto("/blog/");

  await expect(page.locator(".blog-page")).toHaveCSS("background-color", "rgb(242, 246, 250)");
  await expect(page.locator(".blog-hero h1")).toHaveCSS("color", "rgb(24, 42, 64)");
  await expect(page.locator(".blog-hero h1 em")).toHaveCSS("color", "rgb(24, 42, 64)");
  const glassCard = page.locator(".blog-welcome").first();
  await expect(glassCard).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  expect(await glassCard.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain("linear-gradient(");
  await expect(page.locator(".blog-intro")).toHaveCSS("color", "rgb(72, 91, 112)");
  await expect(page.locator(".blog-eyebrow").first()).toHaveCSS("color", "rgb(49, 95, 145)");
});

test("royal gradients appear on pages and controls, never over the original photographs", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });

  for (const [route, surface] of [
    ["/", ".kerygma-gateway"],
    ["/blog/", ".blog-page"],
    ["/word/", ".word-page"],
    ["/team/", ".editorial-page"],
    ["/store/", ".store-page-v2"],
  ] as const) {
    await page.goto(route);
    const backgroundImage = await page.locator(surface).first()
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(backgroundImage, `missing royal gradient on ${route}`).toContain("linear-gradient(");
    const menuControl = page.locator(".theme-toggle, .desktop-menu-toggle, .mobile-menu-toggle").first();
    if (await menuControl.count()) {
      const menuGradient = await menuControl.evaluate((node) => getComputedStyle(node).backgroundImage);
      expect(menuGradient).toContain("linear-gradient(");
    }
  }

  await page.goto("/company/");
  await expect(page.locator(".kerygma-company-hero")).toHaveCSS("background-image", "none");
  await page.goto("/media/");
  const mediaBackground = await page.locator(".media-page").evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(mediaBackground).toContain("media-page-background.webp");
  expect(mediaBackground).not.toContain("gradient(");
});

test("media page restores its original photograph in dark and light modes", async ({ page }) => {
  for (const mode of ["dark", "light"] as const) {
    await page.goto("/media/");
    await page.evaluate((value) => {
      window.localStorage.setItem("journey-with-jesus-theme-mode", value);
    }, mode);
    await page.reload();

    const media = page.locator(".media-page");
    const backgroundImage = await media.evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(backgroundImage, `photo missing in ${mode} mode`).toContain("media-page-background.webp");
    expect(backgroundImage, `image scrim in ${mode} mode`).not.toContain("gradient(");
    await expect(media).toHaveCSS("background-blend-mode", "normal");

    const stage = page.locator(".media-stage");
    await expect(stage).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(stage).toHaveCSS("background-image", "none");
  }
});

test("dark theme shades artwork neutrally without a blue cast", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/company/");
  await expect(page.locator(".kerygma-company-hero-shade"))
    .toHaveCSS("background-color", "rgba(0, 0, 0, 0.2)");
});

test("high-contrast preference replaces translucent glass with solid legible panels", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
    window.localStorage.setItem("journey-with-jesus-accessibility", JSON.stringify({ highContrast: true }));
  });
  await page.goto("/blog/");
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-color", "rgb(12, 40, 85)");
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-image", "none");
});

test("dark mode uses real gold CTAs with dark readable labels", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/");
  const enter = page.locator(".kerygma-enter-button");
  expect(await enter.evaluate((node) => getComputedStyle(node).backgroundImage))
    .toContain("linear-gradient(");
  await expect(enter).toHaveCSS("color", "rgb(6, 20, 47)");
  await expect(enter).toHaveCSS("border-top-color", "rgba(255, 245, 199, 0.85)");

  await page.goto("/company/");
  const studioAction = page.locator(".kerygma-button-gold").first();
  await expect(studioAction).toHaveCSS("color", "rgb(6, 20, 47)");
  expect(await studioAction.evaluate((node) => getComputedStyle(node).backgroundImage))
    .toContain("linear-gradient(");
  await expect(page.locator(".kerygma-company .kerygma-eyebrow").first())
    .toHaveCSS("color", "rgb(255, 218, 112)");
});

test("dark mode keeps original media imagery and excludes gold from photo overlays", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/media/");
  const media = page.locator(".media-page");
  const image = await media.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(image).toContain("media-page-background.webp");
  expect(image).not.toContain("gradient(");
  await expect(media).toHaveCSS("background-blend-mode", "normal");
  await expect(page.locator(".media-stage")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await page.goto("/company/");
  await expect(page.locator(".kerygma-company-hero-shade"))
    .toHaveCSS("background-color", "rgba(0, 0, 0, 0.2)");
});

test("royal gold is scoped to dark mode and respects high contrast", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "dark");
    localStorage.setItem("journey-with-jesus-accessibility", JSON.stringify({ highContrast: true }));
  });
  await page.goto("/blog/");
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-color", "rgb(12, 40, 85)");
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-image", "none");
  await expect(page.locator("html")).toHaveCSS("--gold-bright", "#ffe27a");
});

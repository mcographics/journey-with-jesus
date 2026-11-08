import { expect, test } from "@playwright/test";

test("blog dark mode uses white headings and solid navy surfaces", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/blog/");

  const hero = page.locator(".blog-hero h1");
  const emphasizedTitle = page.locator(".blog-hero h1 em");
  const sectionTitle = page.locator(".blog-section-heading h2");
  const cardTitle = page.locator(".blog-welcome h2").first();

  for (const heading of [hero, emphasizedTitle, sectionTitle, cardTitle]) {
    await expect(heading).toHaveCSS("color", "rgb(247, 250, 255)");
    await expect(heading).toHaveCSS("background-image", "none");
  }

  await expect(page.locator(".blog-page")).toHaveCSS("background-color", "rgb(13, 35, 66)");
  await expect(page.locator(".blog-page")).toHaveCSS("background-image", "none");
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-color", "rgb(24, 54, 86)");
  await expect(page.locator(".blog-topic-card").first()).toHaveCSS("background-image", "none");
});

test("blog light mode uses light cards and dark readable headings", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "light");
  });
  await page.goto("/blog/");

  await expect(page.locator(".blog-page")).toHaveCSS("background-color", "rgb(242, 246, 250)");
  await expect(page.locator(".blog-hero h1")).toHaveCSS("color", "rgb(24, 42, 64)");
  await expect(page.locator(".blog-hero h1 em")).toHaveCSS("color", "rgb(24, 42, 64)");
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".blog-intro")).toHaveCSS("color", "rgb(72, 91, 112)");
  await expect(page.locator(".blog-eyebrow").first()).toHaveCSS("color", "rgb(49, 95, 145)");
});

test("dark mode avoids gradient washes across navigation and key site pages", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });

  for (const [route, surface] of [
    ["/", ".kerygma-gateway"],
    ["/company/", ".kerygma-company-hero"],
    ["/blog/", ".blog-page"],
    ["/word/", ".word-page"],
    ["/team/", ".editorial-page"],
    ["/store/", ".store-page-v2"],
    ["/media/", ".media-page"],
  ] as const) {
    await page.goto(route);
    const backgroundImage = await page.locator(surface).first()
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(backgroundImage, `gradient on ${route}`).not.toContain("gradient(");
    await expect(page.locator(".desktop-menu-toggle")).toHaveCSS("background-image", "none");
  }
});

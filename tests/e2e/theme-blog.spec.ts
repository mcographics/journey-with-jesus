import { expect, test } from "@playwright/test";

test("blog dark mode has crisp white headings and dim reflective royal-blue crystal", async ({ page }) => {
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

  await expect(page.locator(".blog-page")).toHaveCSS("background-color", "rgb(8, 23, 42)");
  const background = await page.locator(".blog-page").evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(background).toContain("linear-gradient(");
  expect(background).toContain("radial-gradient(");
  const glassCard = page.locator(".blog-welcome").first();
  const cardGradient = await glassCard.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(cardGradient).toContain("linear-gradient(");
  await expect(glassCard).toHaveCSS("backdrop-filter", "blur(14px) saturate(1.25)");
  await expect(page.locator(".blog-topic-card").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.locator(".blog-eyebrow").first()).toHaveCSS("color", "rgb(255, 224, 154)");
  await expect(page.locator(".blog-next-note")).toHaveCSS("border-left-color", "rgb(255, 220, 140)");
  const border = await glassCard.evaluate((node) => getComputedStyle(node).borderTopColor);
  expect(border).toContain("127, 188, 244");
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
  expect(mediaBackground).toContain("linear-gradient(");
  expect(mediaBackground).not.toContain("media-page-background.webp");
});

test("media page uses only theme gradients in dark and light modes", async ({ page }) => {
  for (const mode of ["dark", "light"] as const) {
    await page.goto("/media/");
    await page.evaluate((value) => {
      window.localStorage.setItem("journey-with-jesus-theme-mode", value);
    }, mode);
    await page.reload();

    const media = page.locator(".media-page");
    const backgroundImage = await media.evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(backgroundImage, `gradient missing in ${mode} mode`).toContain("linear-gradient(");
    expect(backgroundImage, `unexpected photograph in ${mode} mode`).not.toContain("media-page-background.webp");
    await expect(media).toHaveCSS("background-blend-mode", /^normal(?:,\s*normal)*$/);

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
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-color", "rgb(18, 51, 84)");
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
  await expect(enter).toHaveCSS("color", "rgb(9, 27, 48)");
  await expect(enter).toHaveCSS("border-top-color", "rgba(255, 240, 187, 0.94)");

  await page.goto("/company/");
  const studioAction = page.locator(".kerygma-button-gold").first();
  await expect(studioAction).toHaveCSS("color", "rgb(9, 27, 48)");
  expect(await studioAction.evaluate((node) => getComputedStyle(node).backgroundImage))
    .toContain("linear-gradient(");
  await expect(page.locator(".kerygma-company .kerygma-eyebrow").first())
    .toHaveCSS("color", "rgb(255, 224, 154)");
});

test("dark mode uses a clean gradient with no media photograph", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/media/");
  const media = page.locator(".media-page");
  const image = await media.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(image).toContain("linear-gradient(");
  expect(image).not.toContain("media-page-background.webp");
  await expect(media).toHaveCSS("background-blend-mode", /^normal(?:,\s*normal)*$/);
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
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-color", "rgb(18, 51, 84)");
  await expect(page.locator(".blog-welcome").first()).toHaveCSS("background-image", "none");
  await expect(page.locator("html")).toHaveCSS("--gold-bright", "#ffe27a");
});

test("dark surfaces use the dim crystal-blue palette in the approved mockup", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  for (const route of ["/blog/", "/word/", "/team/"]) {
    await page.goto(route);
    const surface = page.locator(route === "/blog/" ? ".blog-page" : route === "/word/" ? ".word-page" : ".editorial-page");
    await expect(surface).toHaveCSS("background-color", "rgb(8, 23, 42)");
    const gradient = await surface.evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(gradient).toContain("linear-gradient(");
    expect(gradient).not.toContain("12, 52, 116");
  }
  await page.goto("/blog/");
  const card = page.locator(".blog-welcome").first();
  await expect(card).toHaveCSS("backdrop-filter", "blur(14px) saturate(1.25)");
  await expect(card).toHaveCSS("border-top-color", "rgba(127, 188, 244, 0.52)");
});

test("active navigation gleams like solid polished gold", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/blog/");
  const current = page.locator(".nav-link.is-current, .desktop-menu-link.is-current, .mobile-menu-link.is-current").first();
  if (await current.count()) {
    await expect(current).toHaveCSS("color", "rgb(9, 27, 48)");
    await expect(current).toHaveCSS("border-top-color", "rgba(255, 244, 209, 0.87)");
  }
});

test("crystal panels have prismatic reflection layers and a warm metallic underside", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/blog/");
  const card = page.locator(".blog-welcome").first();
  const image = await card.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(image.match(/linear-gradient\(/g)?.length).toBeGreaterThanOrEqual(3);
  await expect(card).toHaveCSS("border-top-color", "rgba(127, 188, 244, 0.52)");
  const shadows = await card.evaluate((node) => getComputedStyle(node).boxShadow);
  expect(shadows).toContain("251, 199, 100");
});

test("the mockup gold button has both specular and metal gradients", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("journey-with-jesus-theme-mode", "dark"));
  await page.goto("/");
  const action = page.locator(".kerygma-enter-button");
  const image = await action.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(image.match(/linear-gradient\(/g)?.length).toBeGreaterThanOrEqual(2);
  await expect(action).toHaveCSS("color", "rgb(9, 27, 48)");
});


test("light mode language control and opened list use pale glass and dark text on landing", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "light");
  });
  await page.goto("/");
  const viewport = page.viewportSize();
  if (viewport && viewport.width > 768) {
    await expect(page.locator(".desktop-utility-drawer")).toHaveAttribute("data-ready", "true");
    await page.mouse.move(viewport.width - 3, 35);
    await expect(page.locator(".desktop-utility-drawer")).toHaveClass(/is-open/);
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const toggle = page.locator(".site-language-toggle");
  const expectDarkLabel = async () => {
    const channels = await toggle.evaluate((node) => getComputedStyle(node).color.match(/\d+/g)?.map(Number) ?? []);
    expect(channels).toHaveLength(3);
    expect(Math.max(...channels)).toBeLessThan(120);
  };
  await expectDarkLabel();
  const background = await toggle.evaluate((node) => getComputedStyle(node).backgroundImage);
  expect(background).toContain("linear-gradient(");
  expect(background).toContain("255, 255, 255");
  await expect(toggle).toHaveCSS("border-top-color", "rgba(126, 163, 205, 0.78)");
  await toggle.click();
  await expectDarkLabel();
  const options = page.locator(".site-language-options");
  await expect(options).toBeVisible();
  await expect(options).toHaveCSS("color", "rgb(25, 56, 84)");
  expect(await options.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain("rgb(255, 255, 255)");
  await expect(options.locator(".site-language-option-code").first()).toHaveCSS("color", "rgb(134, 96, 27)");
  await options.getByRole("option", { name: "Français [FR]" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expectDarkLabel();
});

test("mobile language control stays light in light mode and retains dark crystal palette in dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "light");
  });
  await page.goto("/company/");
  const toggle = page.locator(".site-language-toggle");
  await expect(toggle).toHaveCSS("color", "rgb(22, 52, 81)");
  await expect(toggle).toHaveCSS("min-height", "44px");
  await toggle.click();
  const menu = page.locator(".site-language-options");
  await expect(menu).toHaveCSS("color", "rgb(25, 56, 84)");
  const bounds = await menu.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);

  // Switch themes through the real UI. The test's initial light-mode
  // script runs on every navigation, so a reload would force light again.
  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveCSS("color", "rgb(255, 248, 231)");
  expect(await toggle.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain("32, 76, 127");
  await toggle.click();
  await expect(menu).toHaveCSS("color", "rgb(255, 248, 231)");
});

for (const { screen, viewport } of [
  { screen: "desktop", viewport: { width: 1280, height: 800 } },
  { screen: "mobile", viewport: { width: 375, height: 812 } },
]) {
  test(`site language dropdown uses compact width and name-to-code spacing on ${screen}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/company/");
    if (screen === "desktop") {
      await expect(page.locator(".desktop-utility-drawer")).toHaveAttribute("data-ready", "true");
      await page.mouse.move(viewport.width - 3, 35);
      await expect(page.locator(".desktop-utility-drawer")).toHaveClass(/is-open/);
    }
    await page.locator(".site-language-toggle").click();
    const menu = page.locator(".site-language-options");
    await expect(menu).toBeVisible();
    const bounds = await menu.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThan(100);
    expect(bounds!.width).toBeLessThanOrEqual(150);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);

    for (const option of await menu.locator(".site-language-option").all()) {
      await expect(option).toHaveCSS("justify-content", "flex-start");
      await expect(option).toHaveCSS("gap", "6px");
      const name = await option.locator("span").first().boundingBox();
      const code = await option.locator(".site-language-option-code").boundingBox();
      expect(name).not.toBeNull();
      expect(code).not.toBeNull();
      expect(code!.x - (name!.x + name!.width)).toBeCloseTo(6, 0);
    }
  });
}

for (const { device, viewport } of [
  { device: "desktop", viewport: { width: 1280, height: 800 } },
  { device: "mobile", viewport: { width: 375, height: 812 } },
]) {
  test(`light mode keeps the story overlay subtle and its copy black on ${device}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem("journey-with-jesus-theme-mode", "light");
    });
    await page.goto("/projects/journey-with-jesus/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    const story = page.locator(".storybook-section");
    for (const paragraph of await story.locator("#scripture-title + .storybook-description-panel > p").all()) {
      await expect(paragraph).toHaveCSS("color", "rgb(16, 16, 16)");
      await expect(paragraph).toHaveCSS("-webkit-text-fill-color", "rgb(16, 16, 16)");
      await expect(paragraph).toHaveCSS("text-shadow", "none");
    }
    await expect(story.locator("#scripture-title")).toHaveCSS("color", "rgb(255, 231, 146)");
    const shade = device === "mobile"
      ? await story.locator(".storybook-copy").evaluate((el) => getComputedStyle(el, "::before").backgroundImage)
      : await story.locator(".storybook-shade").evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(shade).toContain(device === "mobile" ? "238, 247, 255, 0.73" : "228, 240, 254, 0.84");

    const mission = page.locator(".mission-section");
    await expect(mission.locator(".virtue-statement > strong")).toHaveCSS("color", "rgb(21, 60, 100)");
    await expect(mission.locator(".virtue-love")).toHaveCSS("color", "rgb(255, 0, 0)");
  });
}

test("dark mode retains white story copy, white virtues, and red Love", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("journey-with-jesus-theme-mode", "dark");
  });
  await page.goto("/projects/journey-with-jesus/");
  await expect(page.locator("#scripture-title + .storybook-description-panel > p").first()).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator(".virtue-statement > strong")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator(".virtue-love")).toHaveCSS("color", "rgb(255, 0, 0)");
});

for (const { screen, viewport } of [
  { screen: "desktop", viewport: { width: 1280, height: 800 } },
  { screen: "mobile", viewport: { width: 375, height: 812 } },
]) {
  test(`story circle has a softer white centre, visible Click Me label, and a gentle pulse on ${screen}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      localStorage.setItem("journey-with-jesus-theme-mode", "light");
    });
    await page.goto("/projects/journey-with-jesus/");
    const seal = page.locator(".storybook-seal");
    await expect(seal).toBeVisible();
    await expect(seal.locator(".storybook-seal-cta")).toHaveText("Click Me");
    await expect(seal.locator(".storybook-seal-cta")).toBeVisible();
    const background = await seal.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(background).toContain("247, 249, 252, 0.82");
    expect(background).toContain("241, 246, 251, 0.73");
    await expect(seal).toHaveCSS("animation-name", "storybook-seal-gentle-pulse");
  });
}

test("story circle honours reduced-motion preferences", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/journey-with-jesus/");
  const seal = page.locator(".storybook-seal");
  await expect(seal.locator(".storybook-seal-cta")).toBeVisible();
  await expect(seal).not.toHaveCSS("animation-name", "storybook-seal-gentle-pulse");
});

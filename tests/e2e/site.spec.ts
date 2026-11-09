import { expect, test } from "@playwright/test";

for (const language of [
  { name: "French", option: "Français [FR]", code: "fr" },
  { name: "Spanish", option: "Español [ES]", code: "es" },
]) {
  test(`${language.name} selection switches the landing and footer logos`, async ({ page }) => {
    await page.goto("/");
    await page.locator(".site-language-toggle").click();
    await page.getByRole("option", { name: language.option }).click();

    const expectedLogo = `kerygma-path-gateway-logo-${language.code}-840.png`;
    await expect(page.locator("html")).toHaveAttribute("lang", language.code);
    await expect(page.locator(".kerygma-gateway-logo")).toHaveAttribute("src", new RegExp(expectedLogo));
    await expect(page.locator(".kerygma-footer-logo")).toHaveAttribute("src", new RegExp(expectedLogo));
  });
}

test("public destinations are available in the desktop menu, with working story CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kerygma Path");
  await expect.poll(() => page.locator(".kerygma-gateway-logo").evaluate((image) => (image as HTMLImageElement).currentSrc)).toMatch(/kerygma-path-gateway-logo-complete-480\.webp$/);
  await page.getByRole("link", { name: "Enter Site" }).click();
  await expect(page).toHaveURL(/\/company\/$/);
  await expect(page.getByRole("heading", { name: /Faithful to the Word/ })).toBeVisible();
  await expect(page.getByText("Christian animation studio devoted to sharing the Gospel", { exact: false })).toBeVisible();

  const desktopMenuButton = page.getByRole("button", { name: "Open site menu" });
  await expect(desktopMenuButton).toBeVisible();
  await desktopMenuButton.click();
  const primaryNavigation = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(primaryNavigation).toBeVisible();
  await expect(primaryNavigation.getByRole("link")).toHaveCount(5);
  for (const destination of ["Blog", "The Word", "Journey with Jesus", "Meet the Team", "Store"]) {
    await expect(primaryNavigation.getByRole("link", { name: destination })).toBeVisible();
  }
  await primaryNavigation.getByRole("link", { name: "Journey with Jesus" }).click();
  await expect(page).toHaveURL(/\/projects\/journey-with-jesus\/$/);
  await expect.poll(() => page.locator(".home-masthead-wordmark-image").evaluate((image) => (image as HTMLImageElement).currentSrc)).toMatch(/journey-with-jesus-wordmark-640\.webp$/);

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
  await page.getByRole("link", { name: "Watch the Stories" }).click();
  await expect(page).toHaveURL(/\/media\/$/);
  await expect(page.getByRole("heading", { name: "Animated stories of faith." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coming Soon" })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Kerygma Path home" })).toBeVisible();
  const footerNavigation = page.getByRole("navigation", { name: "Footer navigation" });
  await expect(footerNavigation.getByRole("link", { name: "Kerygma Path" })).toBeVisible();
  await expect(footerNavigation.getByRole("link", { name: "Media" })).toBeVisible();
});

test.describe("mobile header controls and translations", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });


  test("floating menu fades at rest, returns while scrolling and opens leftward", async ({ page }) => {
    await page.goto("/company/");
    const floating = page.locator(".mobile-navigation");
    const toggle = floating.locator(".mobile-menu-toggle");
    await expect(floating).toHaveCSS("position", "fixed");
    await expect(toggle).toBeVisible();
    const before = await toggle.boundingBox();
    expect(before).not.toBeNull();
    expect(before!.x + before!.width).toBeCloseTo(375 - 14, 0);
    expect(before!.y + before!.height / 2).toBeCloseTo(406, 0);

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.body.scrollHeight);
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
    const after = await toggle.boundingBox();
    expect(after).not.toBeNull();
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.y).toBeCloseTo(before!.y, 0);

    // After scrolling stops, the menu fades to a subtle but tappable handle.
    await expect.poll(async () =>
      floating.evaluate((node) => getComputedStyle(node).opacity)
    ).toBe("0.14");
    await expect(floating).toHaveCSS("pointer-events", "auto");
    await expect(toggle).toBeVisible();

    // Scroll again: it returns to full brightness without moving.
    await page.evaluate(() => window.scrollBy(0, -240));
    await expect.poll(async () =>
      floating.evaluate((node) => getComputedStyle(node).opacity)
    ).toBe("1");
    const restored = await toggle.boundingBox();
    expect(restored!.x).toBeCloseTo(before!.x, 0);
    expect(restored!.y).toBeCloseTo(before!.y, 0);

    // The handle can be tapped even after dimming.
    await expect.poll(async () =>
      floating.evaluate((node) => getComputedStyle(node).opacity)
    ).toBe("0.14");
    await toggle.click();
    const options = floating.locator(".mobile-menu-options");
    await expect(options).toBeVisible();
    await expect(floating).toHaveCSS("opacity", "1");
    await page.waitForTimeout(1600);
    await expect(floating).toHaveCSS("opacity", "1");
    const menuBox = await options.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.x).toBeGreaterThanOrEqual(0);
    expect(menuBox!.x + menuBox!.width).toBeLessThan(before!.x);
    expect(menuBox!.y).toBeGreaterThanOrEqual(0);
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(812);
    await expect(options.getByRole("link", { name: "Blog" })).toBeVisible();
    await toggle.click();
    await expect(options).toBeHidden();
  });

  test("the selected language is applied across all public and policy routes", async ({ page }) => {
    await page.goto("/company/");
    await page.locator(".site-language-toggle").click();
    await page.getByRole("option", { name: "Français [FR]" }).click();

    const routes = [
      "/", "/company/", "/blog/", "/word/", "/projects/journey-with-jesus/",
      "/media/", "/characters/", "/team/", "/store/", "/studio/",
      "/policies/privacy/", "/policies/terms/", "/policies/community-guidelines/",
      "/policies/cookies/", "/policies/copyright/",
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("lang", "fr");
      await expect(page.locator(".site-language-toggle")).toContainText("FR");
      if (route !== "/") {
        const menuButton = page.locator(".mobile-menu-toggle");
        await menuButton.focus();
        await menuButton.click();
        await expect(page.locator(".mobile-menu-options").getByRole("link", { name: "La Parole" })).toBeVisible();
      }
    }

    await page.locator(".site-language-toggle").click();
    await page.getByRole("option", { name: "Español [ES]" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await page.locator(".mobile-menu-toggle").click();
    await expect(page.locator(".mobile-menu-options").getByRole("link", { name: "La Palabra" })).toBeVisible();
  });

  test("header actions stay aligned, and the Bible interface translates without changing Scripture", async ({ page }) => {
    await page.goto("/company/");
    const selectors = [
      page.locator(".site-language-toggle"),
      page.locator(".accessibility-settings-trigger"),
      page.locator(".theme-toggle"),
    ];
    const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];
    for (const selector of selectors) {
      await expect(selector).toBeVisible();
      const box = await selector.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      boxes.push(box!);
    }
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index].y).toBeCloseTo(boxes[0].y, 0);
      expect(boxes[index].x).toBeGreaterThanOrEqual(boxes[index - 1].x + boxes[index - 1].width);
    }
    // The hamburger is a separate floating control at the screen's right centre.
    const floatingMenu = page.locator(".mobile-menu-toggle");
    await expect(floatingMenu).toBeVisible();
    const floatingBox = await floatingMenu.boundingBox();
    expect(floatingBox).not.toBeNull();
    expect(floatingBox!.x + floatingBox!.width).toBeCloseTo(375 - 14, 0);
    expect(floatingBox!.y + floatingBox!.height / 2).toBeCloseTo(812 / 2, 0);

    const accessibilityButton = page.getByRole("button", { name: "Accessibility settings" });
    await accessibilityButton.click();
    await expect(page.getByRole("region", { name: "Accessibility settings" })).toBeVisible();

    const themeButton = page.locator(".theme-toggle");
    await themeButton.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme-mode", "light");

    const menuButton = page.locator(".mobile-menu-toggle");
    await menuButton.focus();
    await menuButton.click();
    const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNavigation).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: "Blog" })).toBeVisible();
    await menuButton.click();

    await page.getByRole("button", { name: "Website language: English" }).click();
    await page.getByRole("option", { name: "Français [FR]" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByRole("heading", { name: /Fidèles à la Parole/ })).toBeVisible();

    await page.goto("/word/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator(".word-translation-control label")).toHaveText("Traduction");
    await expect(page.locator(".word-selects label").nth(1).locator("span")).toHaveText("Livre");
    await expect(page.locator(".word-selects label").nth(2).locator("span")).toHaveText("Chapitre");
    await expect(page.locator("#word-translation-select")).toHaveValue("KJV");
    await expect(page.locator("#word-verse-1 > span")).toHaveText("In the beginning God created the heaven and the earth.");
    await page.locator("#word-search-input").fill("the heaven and the earth");
    await page.locator(".word-search-button").click();
    await expect(page.locator(".word-search-results h2")).toHaveText("Résultats de recherche");
    await expect(page.locator(".word-result > span").first()).toHaveText("In the beginning God created the heaven and the earth.");
  });
});

test("desktop media page fits the player and playlist without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/media/");
  await expect.poll(() => page.locator(".media-page").evaluate((element) => getComputedStyle(element).backgroundImage)).toContain("linear-gradient(");
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("complementary", { name: "Media playlist" })).toBeVisible();
});

test("accessibility preferences persist across routes and light brightness stays scoped to light mode", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("journey-with-jesus-theme-mode", "light"));
  await page.goto("/company/");
  const accessibilityButton = page.getByRole("button", { name: "Accessibility settings" });
  await expect(accessibilityButton).toBeVisible();
  await accessibilityButton.click();

  const settings = page.getByRole("region", { name: "Accessibility settings" });
  await expect(settings).toBeVisible();
  await page.getByLabel("Text size").selectOption("largest");
  await expect(page.locator("body")).toHaveCSS("zoom", "1.16");
  const brightness = page.getByRole("slider", { name: "Light mode brightness" });
  await brightness.focus();
  for (let step = 0; step < 3; step += 1) await brightness.press("ArrowLeft");
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-brightness", "85");
  await expect(page.locator("body")).toHaveCSS("--light-mode-overlay-opacity", "0");

  await page.getByLabel("High contrast colors").check();
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-contrast", "high");
  await page.getByLabel("Color vision palette").selectOption("protanopia");
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-color-vision", "protanopia");
  expect(await page.locator("html").evaluate((root) => getComputedStyle(root).getPropertyValue("--accessibility-link-color").trim())).toBe("#005b91");
  await expect(page.locator(".footer-links a").first()).toHaveCSS("color", "rgb(0, 91, 145)");
  await page.locator(".theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.locator("body").evaluate((body) => getComputedStyle(body, "::after").opacity)).toBe("0");
  expect(await page.locator("html").evaluate((root) => getComputedStyle(root).getPropertyValue("--accessibility-link-color").trim())).toBe("#75c8f4");
  await expect(page.locator(".footer-links a").first()).toHaveCSS("color", "rgb(117, 200, 244)");

  await page.goto("/media/");
  await expect(page.getByRole("button", { name: "Accessibility settings" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-brightness", "85");
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-text-size", "largest");
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-contrast", "high");
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-color-vision", "protanopia");
  await expect(page.locator("body")).toHaveCSS("zoom", "1.16");
  await expect(page.locator(".video-player-section")).toHaveCSS("z-index", "11");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-brightness", "85");
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-text-size", "largest");
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-color-vision", "protanopia");
});

test.describe("mobile accessibility controls", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test("settings remain labeled, touch-sized, and inside the viewport", async ({ page }) => {
    await page.goto("/media/");
    await expect.poll(() => page.locator(".media-page").evaluate((element) => getComputedStyle(element).backgroundImage)).toContain("linear-gradient(");
    const trigger = page.getByRole("button", { name: "Accessibility settings" });
    await expect(trigger).toBeVisible();
    const triggerBounds = await trigger.boundingBox();
    expect(triggerBounds?.width).toBeGreaterThanOrEqual(44);
    expect(triggerBounds?.height).toBeGreaterThanOrEqual(44);
    await trigger.click();
    const panel = page.getByRole("region", { name: "Accessibility settings" });
    await expect(panel).toBeVisible();
    const panelBounds = await panel.boundingBox();
    expect(panelBounds?.x).toBeGreaterThanOrEqual(0);
    expect(panelBounds!.x + panelBounds!.width).toBeLessThanOrEqual(375);
    await expect(page.getByRole("slider", { name: "Light mode brightness" })).toBeVisible();

    for (const [size, zoom] of [["large", "1.08"], ["largest", "1.16"]] as const) {
      await page.getByLabel("Text size").selectOption(size);
      await expect(page.locator("body")).toHaveCSS("zoom", zoom);
      const zoomedBounds = await panel.boundingBox();
      expect(zoomedBounds?.x).toBeGreaterThanOrEqual(0);
      expect(zoomedBounds!.x + zoomedBounds!.width).toBeLessThanOrEqual(375);
      expect(zoomedBounds?.y).toBeGreaterThanOrEqual(0);
      expect(zoomedBounds!.y + zoomedBounds!.height).toBeLessThanOrEqual(812);
      await page.getByRole("button", { name: "Reset to defaults" }).scrollIntoViewIfNeeded();
      await expect(page.getByRole("button", { name: "Reset to defaults" })).toBeInViewport();
    }
  });

  test("reduced motion follows the OS preference until the visitor changes it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/media/");
    await page.getByRole("button", { name: "Accessibility settings" }).click();

    const reduceMotion = page.getByLabel("Reduce interface motion");
    await expect(reduceMotion).toBeChecked();
    await reduceMotion.uncheck();
    await expect(page.locator("html")).toHaveAttribute("data-accessibility-reduce-motion", "false");
    await expect(page.locator(".mobile-navigation")).toHaveCSS("transition-duration", "0.24s");
  });
});

test("cross-origin WebVTT captions load with anonymous CORS on the native video player", async ({ page }) => {
  const captionsUrl = "https://media.example.test/story-en.vtt";
  await page.route(captionsUrl, (route) => route.fulfill({
    status: 200,
    contentType: "text/vtt",
    headers: { "access-control-allow-origin": "*" },
    body: "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nCaption loaded cross-origin",
  }));
  await page.goto("/");
  await page.evaluate((src) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    const track = document.createElement("track");
    track.kind = "captions";
    track.default = true;
    track.src = src;
    video.appendChild(track);
    track.track.mode = "showing";
    document.body.appendChild(video);
  }, captionsUrl);
  await page.waitForFunction(() => {
    const track = document.querySelector("video track") as HTMLTrackElement | null;
    const cue = track?.track.cues?.[0] as VTTCue | undefined;
    return track?.readyState === 2 && cue?.text === "Caption loaded cross-origin";
  });
});

test("accessibility settings are available on every interior site route", async ({ page }) => {
  for (const route of ["/company/", "/projects/journey-with-jesus/", "/media/", "/characters/", "/team/", "/store/", "/studio/", "/policies/privacy/"]) {
    await page.goto(route);
    await expect(page.getByRole("button", { name: "Accessibility settings" })).toBeVisible();
  }
});

test("monochromacy keeps light-mode filled action buttons readable", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "light");
    window.localStorage.setItem("journey-with-jesus-accessibility", JSON.stringify({ colorVisionMode: "monochromacy" }));
  });
  await page.goto("/media/");
  await expect(page.locator("html")).toHaveAttribute("data-accessibility-color-vision", "monochromacy");
  const button = await page.evaluate(() => {
    const control = document.createElement("button");
    control.className = "button button-gold";
    control.textContent = "Submit for review";
    document.querySelector(".media-page")?.appendChild(control);
    const style = getComputedStyle(control);
    return { color: style.color, background: style.backgroundColor };
  });
  expect(button).toEqual({ color: "rgb(255, 255, 255)", background: "rgb(69, 69, 69)" });
});

test("light mode uses muted surfaces and a larger mobile media kicker", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem("journey-with-jesus-theme-mode", "light");
  });
  await page.goto("/media/");

  await expect(page.locator(".media-page")).toHaveCSS("--night", "#f2f4f2");
  const backgroundImage = await page.locator(".media-page")
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(backgroundImage).toContain("linear-gradient(");
  expect(backgroundImage).not.toContain("media-page-background.webp");
  await expect(page.locator(".media-page")).toHaveCSS("background-blend-mode", "normal");
  await expect(page.locator(".media-kicker")).toHaveCSS("font-size", "18px");
});

test("the desktop mobile preview is absent from the main site", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Preview the current page in a mobile layout" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Mobile preview" })).toHaveCount(0);
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

  for (const { route, selector, copySelector } of [
    { route: "/media/", selector: ".media-page", copySelector: ".media-heading p:last-child" },
    { route: "/characters/", selector: ".characters-page", copySelector: ".editorial-intro" },
    { route: "/team/", selector: ".team-page", copySelector: ".editorial-intro" },
    { route: "/store/", selector: ".store-page", copySelector: ".store-unavailable-description" },
  ]) {
    await page.goto(route);
    const title = page.locator(`${selector} h1`).first();
    const copy = page.locator(copySelector ? `${selector} ${copySelector}` : `${selector} p`).first();
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
    const updatedDate = policy.locator(".legal-policy-date");
    const subordinateText = [bodyCopy, updatedDate, policy.locator("a").first()];

    await expect(title).toBeVisible();
    await expect(sectionTitle).toBeVisible();
    await expect(updatedDate).toHaveText("Last updated: November 6, 2026");
    for (const heading of [title, sectionTitle]) {
      await expect(heading).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(heading).toHaveCSS("-webkit-text-fill-color", "rgb(255, 255, 255)");
      await expect(heading).toHaveCSS("text-shadow", "none");
      await expect(heading).toHaveCSS("background-image", "none");
      await expect(heading).toHaveCSS("animation-name", "none");
    }
    for (const copy of subordinateText) {
      await expect(copy).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(copy).toHaveCSS("-webkit-text-fill-color", "rgb(255, 255, 255)");
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
  await expect(founderCard.locator(".team-card-copy")).toBeHidden();
  await founderCard.locator("summary").click();
  await expect(founderCard.getByRole("heading", { name: "Eric Oberhausen" })).toBeVisible();
  await expect(founderCard.locator(".team-role")).toHaveText("Founder");

  await founderCard.locator("summary").click();
  await expect(founderCard.locator(".team-card-copy")).toBeHidden();
  const editorCard = teamCards.nth(1);
  await editorCard.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(editorCard.getByRole("heading", { name: "Kenneth Salmon" })).toBeVisible();
  await expect(editorCard.locator(".team-role")).toHaveText("Editor / Webmaster");
});

test("landing gateway hides site controls and footer until entering, including return navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-header")).toHaveCSS("display", "none");
  await expect(page.locator(".site-footer")).toBeHidden();
  await expect.poll(() => page.locator(".kerygma-gateway-logo").evaluate(async (element) => {
    const image = element as HTMLImageElement;
    try {
      await image.decode();
      return image.naturalWidth > 0 && image.naturalHeight > 0;
    } catch {
      return false;
    }
  })).toBe(true);
  await page.getByRole("link", { name: "Enter Site" }).click();
  await expect(page).toHaveURL(/\/company\/$/);
  await expect(page.locator(".site-header")).toHaveCSS("display", "block");
  await expect(page.getByRole("button", { name: "Open site menu" })).toBeVisible();
  await expect(page.locator(".site-footer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accessibility settings" })).toBeVisible();
  await expect(page.locator(".theme-toggle")).toBeVisible();
  await page.getByRole("link", { name: "Kerygma Path home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".site-header")).toHaveCSS("display", "none");
  await expect(page.locator(".site-footer")).toBeHidden();
});

test("studio dark mode uses radiant gold details, dark readable actions and white main copy", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("journey-with-jesus-theme-mode", "dark"));
  await page.goto("/company/");
  const copy = page.locator(".kerygma-company").locator("h1, h2, h3, p, em, a, .kerygma-principle-number, .kerygma-button span");
  expect(await copy.count()).toBeGreaterThan(20);
  for (const element of await copy.all()) {
    const color = await element.evaluate((node) => getComputedStyle(node).color);
    expect(["rgb(255, 255, 255)", "rgb(255, 224, 154)", "rgb(9, 27, 48)"]).toContain(color);
    await expect(element).toHaveCSS("-webkit-text-fill-color", color);
    const isGoldAction = await element.evaluate((node) => node.classList.contains("kerygma-button-gold"));
    if (isGoldAction) {
      expect(await element.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain("linear-gradient(");
    } else {
      await expect(element).toHaveCSS("background-image", "none");
    }
    await expect(element).toHaveCSS("animation-name", "none");
  }
  for (const label of await page.locator(".kerygma-company .kerygma-eyebrow").all()) {
    await expect(label).toHaveCSS("color", "rgb(255, 224, 154)");
  }
  await expect(page.locator("#mission-title")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.locator("#mission-title em")).toHaveCSS("color", "rgb(255, 224, 154)");
  await expect(page.locator(".kerygma-company-lead")).toHaveCSS("color", "rgb(255, 255, 255)");
});

for (const route of ["/projects/journey-with-jesus/", "/media/", "/characters/", "/team/", "/store/", "/blog/"]) {
  test(`menu shows section links at ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.getByRole("button", { name: "Open site menu", exact: true }).click();
    const menu = page.getByRole("navigation", { name: "Primary navigation" });
    const expected = route === "/team/" || route === "/store/" || route === "/blog/"
      ? ["Studio", "Blog", "The Word", "Journey with Jesus", "Meet the Team", "Store"]
      : ["Studio", "Blog", "The Word", "Media", "Meet the Characters"];
    await expect(menu.getByRole("link")).toHaveText(expected);
  });
}

for (const width of [1280, 375]) {
  test(`team footer stays in place while profiles toggle at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/team/");
    await expect(page.locator(".team-grid")).toHaveAttribute("aria-busy", "false");
    const footerTop = () => page.locator(".site-footer").evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    const originalTop = await footerTop();
    const profiles = page.locator(".team-profile");
    for (let index = 0; index < await profiles.count(); index++) {
      const toggle = profiles.nth(index).locator("summary");
      await toggle.click();
      expect(Math.abs(await footerTop() - originalTop)).toBeLessThan(2);
      await toggle.click();
      expect(Math.abs(await footerTop() - originalTop)).toBeLessThan(2);
    }
  });
}

test("mobile team cards show names and language-aware tap prompts when collapsed", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/team/");
  await expect(page.locator(".team-grid")).toHaveAttribute("aria-busy", "false");
  const captions = page.locator(".team-profile-mobile-caption");
  await expect(captions).toHaveCount(2);
  await expect(captions.nth(0)).toContainText("Eric Oberhausen");
  await expect(captions.nth(1)).toContainText("Kenneth Salmon");
  const portraitBounds = await page.locator(".team-card.team-profile").evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().toJSON()),
  );
  expect(portraitBounds[1].top - portraitBounds[0].bottom).toBeLessThan(110);

  for (const [code, instruction] of [
    ["en", "Tap circle to read more"],
    ["fr", "Touchez le cercle pour en savoir plus"],
    ["es", "Toca el círculo para leer más"],
  ]) {
    await page.evaluate((locale) => localStorage.setItem("kerygmapath-language", locale), code);
    await page.reload();
    await expect(page.locator(".team-grid")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator(".team-profile-mobile-caption .team-prompt-touch")).toHaveText([instruction, instruction]);
    await expect(page.locator(".team-profile-mobile-caption .team-prompt-desktop").first()).toBeHidden();
  }

  await page.locator(".team-profile").first().locator("summary").click();
  await expect(captions.first()).toBeHidden();
  await expect(page.locator(".team-profile").first().locator(".team-card-copy")).toBeVisible();
});

test.describe("mobile light surface brightness", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  test("touch changes white surfaces without a page dimming layer", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("journey-with-jesus-theme-mode", "light"));
    await page.goto("/media/");
    const surface = page.locator(".accessibility-settings-panel");
    await page.getByRole("button", { name: "Accessibility settings", exact: true }).click();
    const before = await surface.evaluate(el => getComputedStyle(el).backgroundColor);
    const slider = page.getByRole("slider", { name: "Light mode brightness" });
    const rect = await slider.boundingBox();
    await page.touchscreen.tap(rect!.x + 12, rect!.y + rect!.height / 2);
    await expect(slider).not.toHaveValue("100");
    await expect.poll(() => surface.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(before);
    expect(await page.locator("body").evaluate(el => getComputedStyle(el, "::after").opacity)).toBe("0");
    const value = await slider.inputValue();
    await page.reload();
    await page.getByRole("button", { name: "Accessibility settings", exact: true }).click();
    await expect(slider).toHaveValue(value);
  });
});

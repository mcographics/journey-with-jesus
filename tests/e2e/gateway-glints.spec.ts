import { expect, test } from "@playwright/test";

test("the original language-aware logo receives a shape-masked traveling light trail", async ({ page }) => {
  await page.goto("/");
  const original = page.locator(".kerygma-gateway-logo");
  const trail = page.locator(".kerygma-gateway-logo-trace");
  const litImage = trail.locator(".kerygma-gateway-logo-trace-image");
  await expect(original).toHaveCount(1);
  await expect(litImage).toHaveCount(1);
  await expect(trail).toHaveAttribute("aria-hidden", "true");
  await expect(trail).toHaveCSS("position", "absolute");
  await expect(trail).toHaveCSS("pointer-events", "none");
  await expect(trail).toHaveCSS("animation-name", "kerygma-logo-light-trace");
  expect(await trail.evaluate((element) => getComputedStyle(element).maskImage)).toContain("linear-gradient(");
  expect(await trail.evaluate((element) => getComputedStyle(element).maskSize)).toBe("310% 100%");
  const originalSrc = await original.getAttribute("src");
  expect(originalSrc).toEqual(await litImage.getAttribute("src"));
  await expect(original).toBeVisible();
});

test("the glint mirrors translated logos without changing their artwork", async ({ page }) => {
  await page.goto("/");
  const viewport = page.viewportSize();
  const drawer = page.locator(".desktop-utility-drawer");
  if (viewport && viewport.width > 768) {
    await expect(drawer).toHaveAttribute("data-ready", "true");
    await page.mouse.move(viewport.width - 3, 35);
    await expect(drawer).toHaveClass(/is-open/);
  }
  for (const [option, suffix] of [
    ["Français [FR]", "fr-840.png"],
    ["Español [ES]", "es-840.png"],
  ] as const) {
    await page.locator(".site-language-toggle").click();
    await page.getByRole("option", { name: option }).click();
    const original = page.locator(".kerygma-gateway-logo");
    const trailImage = page.locator(".kerygma-gateway-logo-trace-image");
    await expect(original).toHaveAttribute("src", new RegExp(suffix.replace(".", "\\.")));
    await expect(trailImage).toHaveAttribute("src", new RegExp(suffix.replace(".", "\\.")));
    expect(await original.getAttribute("src")).toBe(await trailImage.getAttribute("src"));
  }
});

test("reduced-motion settings disable the moving logo trail", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const glint = page.locator(".kerygma-gateway-logo-trace");
  await expect(glint).toHaveCSS("display", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // The site's accessibility setting can persist after an OS preference
  // change, so explicitly re-enable motion before testing the alternate mode.
  await page.evaluate(() => { document.documentElement.dataset.accessibilityReduceMotion = "false"; });
  await expect(glint).toHaveCSS("animation-name", "kerygma-logo-light-trace");
  await page.evaluate(() => { document.documentElement.dataset.accessibilityReduceMotion = "true"; });
  await expect(glint).toHaveCSS("display", "none");
});

test("the existing starfield remains a decorative canvas behind the gateway", async ({ page }) => {
  await page.goto("/");
  const field = page.locator(".kerygma-starfield");
  await expect(field).toHaveAttribute("aria-hidden", "true");
  await expect(field.locator("canvas")).toBeVisible();
  await expect(field).toHaveCSS("pointer-events", "none");
  const size = await field.locator("canvas").evaluate((element) => ({
    w: (element as HTMLCanvasElement).width,
    h: (element as HTMLCanvasElement).height,
  }));
  expect(size.w).toBeGreaterThan(0);
  expect(size.h).toBeGreaterThan(0);
});

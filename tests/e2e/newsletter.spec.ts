import { expect, test } from "@playwright/test";

test("newsletter waits after entry, dismisses, and remains reopenable after refresh", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Kerygma Path updates" });
  const reopen = page.getByRole("button", { name: "Sign up for updates" });
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("link", { name: "Enter Site" }).click();
  await expect(page).toHaveURL(/\/company\/$/);
  await expect(dialog).toHaveCount(0);
  await expect(reopen).toBeVisible();
  await page.clock.runFor(9999);
  await expect(dialog).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(dialog).toBeVisible();
  await expect(reopen).toHaveCount(0);
  await page.getByRole("button", { name: "Close newsletter signup" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(reopen).toBeVisible();
  await reopen.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(reopen).toBeFocused();
  await page.clock.resume();
  await page.reload();
  await expect(reopen).toBeVisible();
  await page.clock.fastForward(15000);
  await expect(dialog).toHaveCount(0);
  await reopen.click();
  await expect(dialog).toBeVisible();
  await page.locator(".newsletter-modal-backdrop").click({ position: { x: 5, y: 5 } });
  await expect(dialog).toHaveCount(0);
  await expect(reopen).toBeVisible();
});

test("direct interior visitors are not prompted but can open signup from the footer", async ({ page }) => {
  await page.clock.install();
  await page.goto("/company/");
  await page.clock.fastForward(15000);
  await expect(page.getByRole("dialog", { name: "Kerygma Path updates" })).toHaveCount(0);
  const signup = page.getByRole("button", { name: "Sign up for updates" });
  await expect(signup).toBeVisible();
  await signup.click();
  await expect(page.getByRole("dialog", { name: "Kerygma Path updates" })).toBeVisible();
});

test("footer stays centered and newsletter/privacy dialogs stay in the viewport on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/company/");
  const footer = page.locator("#site-footer");
  const layout = await footer.locator(".footer-inner").boundingBox();
  expect(layout).not.toBeNull();
  for (const selector of [".footer-content", ".footer-links", ".footer-bottom"]) {
    const rect = await footer.locator(selector).boundingBox();
    expect(rect).not.toBeNull();
    const centreOffset = (rect!.x + rect!.width / 2) - (layout!.x + layout!.width / 2);
    expect(Math.abs(centreOffset)).toBeLessThanOrEqual(12);
  }
  const navRows = footer.locator(".footer-links-row");
  await expect(navRows).toHaveCount(2);
  for (const row of await navRows.all()) {
    const rect = await row.boundingBox();
    expect(rect).not.toBeNull();
    expect(Math.abs((rect!.x + rect!.width / 2) - (layout!.x + layout!.width / 2))).toBeLessThanOrEqual(12);
  }
  const brandRect = await footer.locator(".footer-brand-stack").boundingBox();
  const contentRect = await footer.locator(".footer-content").boundingBox();
  expect(brandRect).not.toBeNull();
  expect(contentRect).not.toBeNull();
  expect(brandRect!.x + brandRect!.width).toBeLessThanOrEqual(contentRect!.x + 12);
  const linksRect = await footer.locator(".footer-links").boundingBox();
  const privacyRect = await footer.locator(".privacy-preferences").boundingBox();
  const aikidoRect = await footer.locator(".footer-protection-aikido").boundingBox();
  expect(linksRect).not.toBeNull();
  expect(privacyRect).not.toBeNull();
  expect(aikidoRect).not.toBeNull();
  // Privacy preferences belongs in the bottom protection row, to the right of Aikido.
  expect(privacyRect!.x).toBeGreaterThanOrEqual(aikidoRect!.x + aikidoRect!.width - 1);
  expect(Math.abs((privacyRect!.y + privacyRect!.height / 2) - (aikidoRect!.y + aikidoRect!.height / 2))).toBeLessThanOrEqual(12);
  await expect(footer.locator(".privacy-preferences-trigger")).toHaveCSS("border-top-width", "0px");
  const desktopLogo = await footer.locator(".kerygma-footer-brand").boundingBox();
  const desktopSocials = await footer.locator(".footer-social-links").boundingBox();
  expect(desktopLogo).not.toBeNull();
  expect(desktopSocials).not.toBeNull();
  expect(desktopLogo!.y + desktopLogo!.height + 8).toBeLessThanOrEqual(desktopSocials!.y);
  const signup = footer.getByRole("button", { name: "Sign up for updates" });
  await expect(signup).toHaveCSS("border-top-width", "0px");
  const signupBox = await signup.boundingBox();
  const tagline = footer.locator(".footer-tagline");
  const taglineBox = await tagline.boundingBox();
  expect(signupBox).not.toBeNull();
  expect(taglineBox).not.toBeNull();
  // The newsletter action sits above the smaller tagline on all screen sizes.
  expect(signupBox!.y + signupBox!.height).toBeLessThan(taglineBox!.y);
  const taglineSize = parseFloat(await tagline.evaluate((node) => getComputedStyle(node).fontSize));
  expect(taglineSize).toBeLessThanOrEqual(14);
  await signup.click();
  await expect(page.getByRole("dialog", { name: "Kerygma Path updates" })).toBeInViewport();
  await page.getByRole("button", { name: "Close newsletter signup" }).click();
  await footer.getByRole("button", { name: "Privacy preferences" }).click();
  await expect(page.getByRole("dialog", { name: "Privacy preferences" })).toBeInViewport();
});


test("footer navigation stays centered and compact on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/company/");
  const footer = page.locator("#site-footer");
  const layout = await footer.locator(".footer-inner").boundingBox();
  expect(layout).not.toBeNull();
  for (const selector of [".footer-brand-stack", ".footer-content", ".footer-links", ".footer-bottom"]) {
    const rect = await footer.locator(selector).boundingBox();
    expect(rect).not.toBeNull();
    expect(Math.abs((rect!.x + rect!.width / 2) - (layout!.x + layout!.width / 2))).toBeLessThanOrEqual(12);
  }
  await expect(footer.locator(".footer-links-row")).toHaveCount(2);
  const mobileLogo = await footer.locator(".kerygma-footer-brand").boundingBox();
  const mobileSocials = await footer.locator(".footer-social-links").boundingBox();
  expect(mobileLogo).not.toBeNull();
  expect(mobileSocials).not.toBeNull();
  // The enlarged logo has its own layout space, rather than overlapping icons.
  expect(mobileLogo!.width).toBeGreaterThanOrEqual(150);
  expect(mobileLogo!.y + mobileLogo!.height + 10).toBeLessThanOrEqual(mobileSocials!.y);
  const mobileAikido = await footer.locator(".footer-protection-aikido").boundingBox();
  const mobilePrivacy = await footer.locator(".privacy-preferences").boundingBox();
  expect(mobileAikido).not.toBeNull();
  expect(mobilePrivacy).not.toBeNull();
  expect(mobilePrivacy!.x).toBeGreaterThanOrEqual(mobileAikido!.x + mobileAikido!.width - 1);
  expect(Math.abs((mobilePrivacy!.y + mobilePrivacy!.height / 2) - (mobileAikido!.y + mobileAikido!.height / 2))).toBeLessThanOrEqual(12);
  await expect(footer.locator(".privacy-preferences-trigger")).toHaveCSS("border-top-width", "0px");
  const signup = footer.getByRole("button", { name: "Sign up for updates" });
  await expect(signup).toHaveCSS("border-top-width", "0px");
  const tagline = footer.locator(".footer-tagline");
  const signupBox = await signup.boundingBox();
  const taglineBox = await tagline.boundingBox();
  expect(signupBox).not.toBeNull();
  expect(taglineBox).not.toBeNull();
  expect(signupBox!.y + signupBox!.height).toBeLessThan(taglineBox!.y);
  await expect(tagline).toHaveCSS("font-size", "13px");
});

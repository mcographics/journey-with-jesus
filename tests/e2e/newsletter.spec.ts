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
  const brandRect = await footer.locator(".footer-brand-heading").boundingBox();
  const contentRect = await footer.locator(".footer-content").boundingBox();
  expect(brandRect).not.toBeNull();
  expect(contentRect).not.toBeNull();
  expect(brandRect!.x + brandRect!.width).toBeLessThanOrEqual(contentRect!.x + 12);
  const linksRect = await footer.locator(".footer-links").boundingBox();
  const protectionRect = await footer.locator(".footer-protection").boundingBox();
  const footerBottomRect = await footer.locator(".footer-bottom").boundingBox();
  expect(protectionRect).not.toBeNull();
  expect(footerBottomRect).not.toBeNull();
  // Security is just above the social icons, with a controlled 6px lift.
  const socialRect = await footer.locator(".footer-social-links").boundingBox();
  expect(socialRect).not.toBeNull();
  await expect(footer.locator(".footer-protection")).toHaveCSS("top", "-6px");
  const desktopOffset = (protectionRect!.y + protectionRect!.height / 2) -
    (socialRect!.y + socialRect!.height / 2);
  expect(Math.abs(desktopOffset + 6)).toBeLessThanOrEqual(4);
  expect(protectionRect!.x).toBeGreaterThanOrEqual(footerBottomRect!.x + footerBottomRect!.width - 12);
  expect(Math.abs(protectionRect!.x + protectionRect!.width - (layout!.x + layout!.width))).toBeLessThanOrEqual(12);
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
  const brandTagline = footer.locator(".footer-brand-stack .footer-brand-tagline");
  const desktopTagline = await brandTagline.boundingBox();
  const desktopSocials = await footer.locator(".footer-social-links").boundingBox();
  expect(desktopLogo).not.toBeNull();
  expect(desktopTagline).not.toBeNull();
  expect(desktopSocials).not.toBeNull();
  await expect(brandTagline).toHaveText("CHRISTIAN ANIMATION WITH PURPOSE");
  await expect(footer.locator(".footer-brand-heading")).toHaveCSS("top", "0px");
  expect(desktopLogo!.width).toBeGreaterThanOrEqual(225);
  await expect(footer.locator(".kerygma-footer-brand")).toHaveCSS("top", "-6px");
  // Raised logo, then tagline, then icons: each has its own clear space.
  const footerRect = await footer.boundingBox();
  expect(footerRect).not.toBeNull();
  expect(desktopLogo!.y).toBeGreaterThanOrEqual(footerRect!.y);
  expect(desktopLogo!.y + desktopLogo!.height + 6).toBeLessThanOrEqual(desktopTagline!.y);
  // Measure the rendered picture/image too, not only its former fixed-height link.
  const desktopPicture = footer.locator(".kerygma-footer-logo-picture");
  await expect(desktopPicture).toHaveCSS("position", "static");
  const desktopImage = await footer.locator(".kerygma-footer-logo").boundingBox();
  expect(desktopImage).not.toBeNull();
  expect(desktopImage!.height).toBeGreaterThan(65);
  expect(desktopImage!.y + desktopImage!.height + 6).toBeLessThanOrEqual(desktopTagline!.y);
  expect(desktopTagline!.y + desktopTagline!.height + 2).toBeLessThanOrEqual(desktopSocials!.y);
  await expect(brandTagline).toHaveCSS("white-space", "nowrap");
  const desktopLineHeight = await brandTagline.evaluate((node) => parseFloat(getComputedStyle(node).lineHeight));
  expect(desktopTagline!.height).toBeLessThanOrEqual(desktopLineHeight + 1);
  // Prevent reintroduction of the excessively tall desktop footer.
  await expect(footer.locator(".footer-inner")).toHaveCSS("padding-top", "20px");
  expect(footerRect!.height).toBeLessThanOrEqual(225);
  const signup = footer.getByRole("button", { name: "Sign up for updates" });
  await expect(signup).toHaveCSS("border-top-width", "0px");
  const signupBox = await signup.boundingBox();
  const messageBox = await footer.locator(".footer-message").boundingBox();
  expect(signupBox).not.toBeNull();
  expect(messageBox).not.toBeNull();
  // Newsletter remains at the top of the center footer column.
  expect(signupBox!.y + signupBox!.height).toBeLessThanOrEqual(messageBox!.y);
  await signup.click();
  await expect(page.getByRole("dialog", { name: "Kerygma Path updates" })).toBeInViewport();
  await page.getByRole("button", { name: "Close newsletter signup" }).click();
  await footer.getByRole("button", { name: "Privacy preferences" }).click();
  await expect(page.getByRole("dialog", { name: "Privacy preferences" })).toBeInViewport();
});


test("desktop footer tagline stays on one line at a narrower desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/company/");
  const footer = page.locator("#site-footer");
  const tagline = footer.locator(".footer-brand-tagline");
  const taglineBox = await tagline.boundingBox();
  const imageBox = await footer.locator(".kerygma-footer-logo").boundingBox();
  const footerBox = await footer.boundingBox();
  expect(taglineBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  await expect(tagline).toHaveText("CHRISTIAN ANIMATION WITH PURPOSE");
  await expect(tagline).toHaveCSS("white-space", "nowrap");
  const lineHeight = await tagline.evaluate((node) => parseFloat(getComputedStyle(node).lineHeight));
  expect(taglineBox!.height).toBeLessThanOrEqual(lineHeight + 1);
  expect(taglineBox!.x).toBeGreaterThanOrEqual(footerBox!.x);
  expect(taglineBox!.x + taglineBox!.width).toBeLessThanOrEqual(footerBox!.x + footerBox!.width);
  expect(imageBox!.y + imageBox!.height + 6).toBeLessThanOrEqual(taglineBox!.y);
  const protection = await footer.locator(".footer-protection").boundingBox();
  const social = await footer.locator(".footer-social-links").boundingBox();
  expect(protection).not.toBeNull();
  expect(social).not.toBeNull();
  // Keep the same subtle lift at a narrower desktop viewport.
  await expect(footer.locator(".footer-protection")).toHaveCSS("top", "-6px");
  const narrowOffset = (protection!.y + protection!.height / 2) -
    (social!.y + social!.height / 2);
  expect(Math.abs(narrowOffset + 6)).toBeLessThanOrEqual(4);
});


test("footer navigation stays centered and compact on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/company/");
  const footer = page.locator("#site-footer");
  const layout = await footer.locator(".footer-inner").boundingBox();
  expect(layout).not.toBeNull();
  for (const selector of [".footer-brand-stack", ".footer-content", ".footer-links", ".footer-bottom", ".footer-protection"]) {
    const rect = await footer.locator(selector).boundingBox();
    expect(rect).not.toBeNull();
    expect(Math.abs((rect!.x + rect!.width / 2) - (layout!.x + layout!.width / 2))).toBeLessThanOrEqual(12);
  }
  await expect(footer.locator(".footer-links-row")).toHaveCount(2);
  const creditBox = await footer.locator(".footer-bottom").boundingBox();
  const protectionBox = await footer.locator(".footer-protection").boundingBox();
  expect(creditBox).not.toBeNull();
  expect(protectionBox).not.toBeNull();
  // On phones the entire protection group follows the centered credits.
  expect(protectionBox!.y).toBeGreaterThanOrEqual(creditBox!.y + creditBox!.height);
  await expect(footer.locator(".footer-protection")).toHaveCSS("margin-top", "0px");
  await expect(footer.locator(".footer-protection")).toHaveCSS("top", "0px");
  const mobileLogo = await footer.locator(".kerygma-footer-brand").boundingBox();
  const mobileTagline = await footer.locator(".footer-brand-tagline").boundingBox();
  const mobileSocials = await footer.locator(".footer-social-links").boundingBox();
  expect(mobileLogo).not.toBeNull();
  expect(mobileTagline).not.toBeNull();
  expect(mobileSocials).not.toBeNull();
  await expect(footer.locator(".footer-brand-tagline")).toHaveText("CHRISTIAN ANIMATION WITH PURPOSE");
  await expect(footer.locator(".footer-brand-heading")).toHaveCSS("top", "-22px");
  expect(mobileLogo!.width).toBeGreaterThanOrEqual(205);
  await expect(footer.locator(".kerygma-footer-brand")).toHaveCSS("top", "-10px");
  const mobileFooterRect = await footer.boundingBox();
  expect(mobileFooterRect).not.toBeNull();
  expect(mobileLogo!.y).toBeGreaterThanOrEqual(mobileFooterRect!.y);
  expect(mobileLogo!.y + mobileLogo!.height + 8).toBeLessThanOrEqual(mobileTagline!.y);
  await expect(footer.locator(".kerygma-footer-logo-picture")).toHaveCSS("position", "static");
  const mobileImage = await footer.locator(".kerygma-footer-logo").boundingBox();
  expect(mobileImage).not.toBeNull();
  expect(mobileImage!.height).toBeGreaterThan(60);
  expect(mobileImage!.y + mobileImage!.height + 8).toBeLessThanOrEqual(mobileTagline!.y);
  expect(mobileTagline!.y + mobileTagline!.height + 10).toBeLessThanOrEqual(mobileSocials!.y);
  const mobileAikido = await footer.locator(".footer-protection-aikido").boundingBox();
  const mobilePrivacy = await footer.locator(".privacy-preferences").boundingBox();
  expect(mobileAikido).not.toBeNull();
  expect(mobilePrivacy).not.toBeNull();
  expect(mobilePrivacy!.x).toBeGreaterThanOrEqual(mobileAikido!.x + mobileAikido!.width - 1);
  expect(Math.abs((mobilePrivacy!.y + mobilePrivacy!.height / 2) - (mobileAikido!.y + mobileAikido!.height / 2))).toBeLessThanOrEqual(12);
  await expect(footer.locator(".privacy-preferences-trigger")).toHaveCSS("border-top-width", "0px");
  const signup = footer.getByRole("button", { name: "Sign up for updates" });
  await expect(signup).toHaveCSS("border-top-width", "0px");
  const signupBox = await signup.boundingBox();
  const messageBox = await footer.locator(".footer-message").boundingBox();
  expect(signupBox).not.toBeNull();
  expect(messageBox).not.toBeNull();
  expect(signupBox!.y + signupBox!.height).toBeLessThanOrEqual(messageBox!.y);
  await expect(footer.locator(".footer-brand-tagline")).toHaveCSS("font-size", "11px");
  await expect(footer.locator(".footer-brand-tagline")).toHaveCSS("white-space", "nowrap");
});

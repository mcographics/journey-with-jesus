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
  await footer.getByRole("button", { name: "Sign up for updates" }).click();
  await expect(page.getByRole("dialog", { name: "Kerygma Path updates" })).toBeInViewport();
  await page.getByRole("button", { name: "Close newsletter signup" }).click();
  await footer.getByRole("button", { name: "Privacy preferences" }).click();
  await expect(page.getByRole("dialog", { name: "Privacy preferences" })).toBeInViewport();
});

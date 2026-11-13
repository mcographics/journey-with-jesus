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
  await expect(reopen).toHaveCount(0);
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
  await page.reload();
  await page.clock.runFor(1);
  await expect(reopen).toBeVisible();
  await page.clock.runFor(15000);
  await expect(dialog).toHaveCount(0);
  await reopen.click();
  await expect(dialog).toBeVisible();
  await page.locator(".newsletter-modal-backdrop").click({ position: { x: 5, y: 5 } });
  await expect(dialog).toHaveCount(0);
  await expect(reopen).toBeVisible();
});

test("direct interior visitors are not prompted or shown a signup link", async ({ page }) => {
  await page.clock.install();
  await page.goto("/company/");
  await page.clock.fastForward(15000);
  await expect(page.getByRole("dialog", { name: "Kerygma Path updates" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign up for updates" })).toHaveCount(0);
});

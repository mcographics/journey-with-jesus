import { expect, test } from "@playwright/test";

test("Creative HQ login reveals only the chosen method and preserves the footer", async ({ page }) => {
  await page.goto("/studio/");
  const picker = page.getByRole("group", { name: "Choose your login method" });
  test.skip(!(await picker.isVisible()), "Studio authentication is not configured for this test deployment.");

  await expect(page.getByRole("heading", { name: "Choose your login method" })).toBeVisible();
  await expect(picker.getByRole("button")).toHaveCount(3);
  await expect(page.getByRole("contentinfo")).toBeVisible();

  await picker.getByRole("button", { name: /Passkey/ }).click();
  await expect(page.getByLabel("Passkey sign-in")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to login methods" }).click();
  await expect(picker).toBeVisible();

  await picker.getByRole("button", { name: /Microsoft Authenticator/ }).click();
  await expect(page.getByLabel("Microsoft Authenticator verification")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to login methods" }).click();

  await picker.getByRole("button", { name: /Magic Link/ }).click();
  await expect(page.getByLabel("Magic Link sign-in")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
  await expect(picker).toHaveCount(0);
});

test("Studio method picker remains compact on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/studio/");
  const picker = page.getByRole("group", { name: "Choose your login method" });
  test.skip(!(await picker.isVisible()), "Studio authentication is not configured for this test deployment.");

  await expect(picker.getByRole("button")).toHaveCount(3);
  const card = page.locator(".studio-login-card");
  await expect(card).toBeVisible();
  const width = await card.evaluate((el) => el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(375);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await picker.getByRole("button", { name: /Magic Link/ }).click();
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

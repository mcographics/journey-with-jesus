import { expect, test } from "@playwright/test";

test("Creative HQ login reveals only the chosen method and preserves the footer", async ({ page }) => {
  await page.goto("/studio/");
  const picker = page.getByRole("group", { name: "Choose your login method" });
  test.skip(!(await picker.isVisible()), "Studio authentication is not configured for this test deployment.");

  await expect(page.getByRole("heading", { name: "Choose your login method" })).toBeVisible();
  await expect(picker.getByRole("button")).toHaveCount(3);
  await expect(picker.getByText(/AVAILABLE|EXPERIMENTAL|PLANNED/)).toHaveCount(0);
  await expect(page.getByRole("contentinfo")).toBeVisible();

  await picker.getByRole("button", { name: /Passkey/ }).click();
  await expect(page.getByLabel("Passkey sign-in")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to login methods" }).click();
  await expect(picker).toBeVisible();

  await picker.getByRole("button", { name: /Microsoft Authenticator/ }).click();
  await expect(page.getByLabel("Microsoft Authenticator verification")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use passkey" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use Magic Link" })).toBeVisible();
  await page.getByRole("button", { name: "Back to login methods" }).click();

  await picker.getByRole("button", { name: /Passkey/ }).click();
  await expect(page.getByRole("button", { name: "Sign in with passkey" })).toBeVisible();
  await expect(page.getByText(/First time\? Sign in with Magic Link/)).toBeVisible();
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

test("Studio footer finishes flush with the page on desktop and mobile", async ({ page }) => {
  for (const size of [
    { width: 1440, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/studio/");

    const picker = page.getByRole("group", { name: "Choose your login method" });
    test.skip(!(await picker.isVisible()), "Studio authentication is not configured for this test deployment.");
    const footer = page.locator("footer.site-footer");
    await expect(footer).toBeAttached();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const metrics = await page.evaluate(() => {
      const footer = document.querySelector("footer.site-footer");
      if (!footer) throw new Error("Site footer is missing");
      const pageEnd = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const footerEnd = footer.getBoundingClientRect().bottom + window.scrollY;
      return { gap: pageEnd - footerEnd, viewportGap: window.innerHeight - footer.getBoundingClientRect().bottom, documentEnd: pageEnd };
    });
    expect(metrics.gap, "Unexpected gap under footer at " + size.width + "px").toBeLessThanOrEqual(2);
    expect(metrics.viewportGap, "Unexpected blank space after footer at " + size.width + "px").toBeLessThanOrEqual(2);
  }
});

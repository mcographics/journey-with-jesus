import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`sharing dialog works at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 844 });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/company/");
    if (width > 768) {
      await expect(page.locator(".desktop-utility-drawer")).toHaveAttribute("data-ready", "true");
      await page.mouse.move(width - 3, 35);
    }
    const trigger = page.getByRole("button", { name: "Share this page" });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveCSS("pointer-events", "auto");
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Share Kerygma Path" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link")).toHaveCount(11);
    await expect(dialog.getByRole("link", { name: "Facebook", exact: true })).toHaveAttribute("href", /u=https%3A%2F%2Fkerygmapath.com%2Fcompany%2F/);
    await dialog.getByRole("button", { name: "Copy link" }).click();
    await expect(dialog.getByRole("status")).toHaveText("Link copied!");
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("https://kerygmapath.com/company/");
    await expect(dialog.getByRole("link", { name: "Email", exact: true })).toHaveAttribute("href", /^mailto:\?subject=.+&body=.+/);
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
}

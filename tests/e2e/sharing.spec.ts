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
    const preview = dialog.getByRole("img");
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1600);
    await expect(dialog.getByRole("link", { name: "Download image" })).toHaveAttribute("download", "Kerygma-Path.jpg");
    await dialog.getByText("Share a link instead", { exact: true }).click();
    await expect(dialog.getByRole("link")).toHaveCount(12);
    await expect(dialog.getByRole("link", { name: "Facebook", exact: true })).toHaveAttribute("href", /u=https%3A%2F%2Fkerygmapath.com%2Fcompany%2F/);
    await dialog.getByRole("button", { name: "Copy link" }).click();
    await expect(dialog.getByRole("status")).toHaveText("Link copied!");
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("https://kerygmapath.com/company/");
    await expect(dialog.getByRole("link", { name: "Email link", exact: true })).toHaveAttribute("href", /^mailto:\?subject=.+&body=.+/);
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
}

test("native image sharing passes the real JPEG file and page link", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: (data: ShareData) => data.files?.[0]?.type === "image/jpeg" });
    Object.defineProperty(navigator, "share", { configurable: true, value: async (data: ShareData) => {
      const file = data.files![0];
      const result = { name: file.name, type: file.type, size: file.size, header: Array.from(new Uint8Array(await file.arrayBuffer()).slice(0, 2)), text: data.text };
      (window as Window & { sharedImage?: typeof result }).sharedImage = result;
    } });
  });
  await page.goto("/company/");
  await expect(page.locator(".desktop-utility-drawer")).toHaveAttribute("data-ready", "true");
  await page.mouse.move(page.viewportSize()!.width - 3, 35);
  await page.getByRole("button", { name: "Share this page" }).click();
  const dialog = page.getByRole("dialog", { name: "Share Kerygma Path" });
  await expect(dialog.getByRole("button", { name: "Share image + link" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Share image + link" }).click();
  await expect(dialog.getByRole("status")).toContainText("Image sent to your sharing app.");
  const result = await page.evaluate(() => (window as Window & { sharedImage?: { name: string; type: string; size: number; header: number[]; text: string } }).sharedImage);
  expect(result).toMatchObject({ name: "Kerygma-Path.jpg", type: "image/jpeg", header: [255, 216] });
  expect(result!.size).toBeGreaterThan(100_000);
  expect(result!.text).toContain("https://kerygmapath.com/company/");
});

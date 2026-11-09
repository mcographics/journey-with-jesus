import { expect, test } from "@playwright/test";

test("sitewide browser and app icon variants resolve", async ({ page }) => {
  await page.goto("/");

  const icons = await page.locator('link[rel="icon"]').evaluateAll((links) =>
    links.map((link) => {
      const element = link as HTMLLinkElement;
      const url = new URL(element.href);
      return { path: url.pathname, sizes: element.sizes, type: element.type };
    }),
  );

  expect(icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: "/favicon.ico", sizes: "any" }),
      expect.objectContaining({ path: "/icon.svg", type: "image/svg+xml" }),
      expect.objectContaining({ path: "/icon1.png", sizes: "16x16" }),
      expect.objectContaining({ path: "/icon2.png", sizes: "32x32" }),
      expect.objectContaining({ path: "/icon3.png", sizes: "48x48" }),
      expect.objectContaining({ path: "/icon4.png", sizes: "192x192" }),
      expect.objectContaining({ path: "/icon5.png", sizes: "512x512" }),
    ]),
  );

  const appleIcon = page.locator('link[rel="apple-touch-icon"]');
  await expect(appleIcon).toHaveAttribute("sizes", "180x180");

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();
  const manifestUrl = new URL(manifestHref!, page.url());
  const manifestResponse = await page.request.get(manifestUrl.toString());
  expect(manifestResponse.ok()).toBe(true);

  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("Kerygma Path — Journey with Jesus");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "./icon4.png", sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ src: "./icon5.png", sizes: "512x512", type: "image/png" }),
    ]),
  );

  for (const icon of manifest.icons) {
    const iconUrl = new URL(icon.src, manifestUrl);
    const response = await page.request.get(iconUrl.toString());
    expect(response.ok(), iconUrl.toString()).toBe(true);
  }
});
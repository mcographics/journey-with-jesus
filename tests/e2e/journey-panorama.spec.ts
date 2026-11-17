import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`Journey invitation panorama keeps its full composition on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/projects/journey-with-jesus/");

    const section = page.locator(".invitation-section");
    const image = section.locator("img.invitation-background");
    await section.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute("alt", /^A biblical history panorama/);
    await image.evaluate(async (element) => (element as HTMLImageElement).decode());

    const dimensions = await section.evaluate((element) => {
      const image = element.querySelector("img.invitation-background") as HTMLImageElement | null;
      const heading = element.querySelector(".invitation-heading");
      if (!image || !heading) throw new Error("Invitation artwork or copy is missing");
      const imageRect = image.getBoundingClientRect();
      const headingRect = heading.getBoundingClientRect();
      return {
        source: new URL(image.currentSrc).pathname,
        objectFit: getComputedStyle(image).objectFit,
        naturalRatio: image.naturalWidth / image.naturalHeight,
        renderedRatio: imageRect.width / imageRect.height,
        copyGap: headingRect.top - imageRect.bottom,
      };
    });

    expect(dimensions.source).toMatch(/\/images\/biblical-history-panorama-\d+\.webp$/);
    expect(dimensions.objectFit).toBe("contain");
    expect(Math.abs(dimensions.naturalRatio - 2048 / 877)).toBeLessThan(0.01);
    expect(Math.abs(dimensions.renderedRatio - 2048 / 877)).toBeLessThan(0.01);
    expect(dimensions.copyGap).toBeGreaterThanOrEqual(12);
  });
}

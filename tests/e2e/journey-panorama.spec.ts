import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  for (const theme of ["dark", "light"] as const) {
    test(`Journey invitation layers its panorama behind readable copy on ${viewport.name} in ${theme} mode`, async ({ page }) => {
      await page.addInitScript((mode) => {
        window.localStorage.setItem("journey-with-jesus-theme-mode", mode);
      }, theme);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/projects/journey-with-jesus/");

      const section = page.locator(".invitation-section");
      const image = section.locator("img.invitation-background");
      const shade = section.locator(".invitation-shade");
      const heading = section.locator(".invitation-heading");
      const action = section.getByRole("link", { name: /Explore Our Media/ });
      await section.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute("alt", /^A biblical history panorama/);
      await image.evaluate(async (element) => (element as HTMLImageElement).decode());
      await expect(heading).toBeVisible();
      await expect(action).toBeVisible();
      await expect(action).toHaveAttribute("href", "/media/");

      const positions = await section.evaluate((element) => {
        const image = element.querySelector("img.invitation-background") as HTMLImageElement;
        const shade = element.querySelector(".invitation-shade") as HTMLElement;
        const content = element.querySelector(".invitation-content") as HTMLElement;
        const sectionBox = element.getBoundingClientRect();
        const imageBox = image.getBoundingClientRect();
        const contentBox = content.getBoundingClientRect();
        const shadeStyle = getComputedStyle(shade);
        return {
          source: new URL(image.currentSrc).pathname,
          objectFit: getComputedStyle(image).objectFit,
          imageCoversSection: Math.abs(imageBox.top - sectionBox.top) < 2
            && Math.abs(imageBox.bottom - sectionBox.bottom) < 2
            && Math.abs(imageBox.width - sectionBox.width) < 2,
          contentOverImage: contentBox.top >= imageBox.top - 2
            && contentBox.bottom <= imageBox.bottom + 2,
          shadePosition: shadeStyle.position,
          shadeBackground: shadeStyle.backgroundImage,
          imageLayer: Number(getComputedStyle(image.parentElement!).zIndex),
          shadeLayer: Number(shadeStyle.zIndex),
          contentLayer: Number(getComputedStyle(content).zIndex),
        };
      });

      expect(positions.source).toMatch(/\/images\/biblical-history-panorama-\d+\.webp$/);
      expect(positions.objectFit).toBe("cover");
      expect(positions.imageCoversSection).toBe(true);
      expect(positions.contentOverImage).toBe(true);
      expect(positions.shadePosition).toBe("absolute");
      expect(positions.shadeBackground).toContain("linear-gradient(");
      expect(positions.imageLayer).toBeLessThan(positions.shadeLayer);
      expect(positions.shadeLayer).toBeLessThan(positions.contentLayer);
      if (theme === "light") {
        expect(positions.shadeBackground).toContain("242, 248, 255");
      } else {
        expect(positions.shadeBackground).toContain("5, 17, 35");
      }
      const overflow = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(overflow.document).toBeLessThanOrEqual(overflow.viewport);
    });
  }
}

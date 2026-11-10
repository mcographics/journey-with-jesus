import { expect, test } from "@playwright/test";

test("a height-limited widescreen player keeps the playlist beside its measured frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.goto("/media/");

  const layout = page.locator(".media-layout");
  await expect.poll(() => layout.getAttribute("class")).toContain("has-player-width");
  const gap = await page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>(".video-frame");
    const playlist = document.querySelector<HTMLElement>(".playlist-panel");
    if (!frame || !playlist) throw new Error("Media player or playlist is missing");
    return playlist.getBoundingClientRect().left - frame.getBoundingClientRect().right;
  });

  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(40);
});

test("desktop portrait playback keeps the playlist close to the player", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/media/");

  const gap = await page.locator(".media-layout").evaluate((layout) => {
    layout.classList.add("is-portrait");
    layout.classList.add("has-player-width");
    const frame = layout.querySelector<HTMLElement>(".video-frame");
    const shell = layout.querySelector<HTMLElement>(".video-shell");
    const playlist = layout.querySelector<HTMLElement>(".playlist-panel");
    if (!frame || !shell || !playlist) throw new Error("Media layout elements are missing");

    const playerWidth = Math.min(388, window.innerHeight * 0.43875);
    layout.style.setProperty("--media-player-width", `${playerWidth}px`);
    frame.classList.add("is-portrait");
    shell.style.width = `${playerWidth}px`;
    frame.style.width = `${playerWidth}px`;
    frame.style.height = `${playerWidth * 16 / 9}px`;
    frame.style.aspectRatio = "9 / 16";

    return playlist.getBoundingClientRect().left - frame.getBoundingClientRect().right;
  });

  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(40);
});

test("mobile playlist starts collapsed, opens on request, and follows the selected site language", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/media/");

  const playlist = page.locator("#media-playlist");
  await expect(page.getByRole("button", { name: "View playlist" })).toHaveAttribute("aria-expanded", "false");
  await expect(playlist).toBeHidden();

  await page.getByRole("button", { name: "View playlist" }).click();
  await expect(page.getByRole("button", { name: "Hide playlist" })).toHaveAttribute("aria-expanded", "true");
  await expect(playlist).toBeVisible();

  await page.locator(".site-language-toggle").click();
  await page.getByRole("option", { name: "Français [FR]" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("button", { name: "Masquer la liste de lecture" })).toBeVisible();

  await page.getByRole("button", { name: "Masquer la liste de lecture" }).click();
  await expect(page.getByRole("button", { name: "Voir la liste de lecture" })).toHaveAttribute("aria-expanded", "false");
  await expect(playlist).toBeHidden();
});

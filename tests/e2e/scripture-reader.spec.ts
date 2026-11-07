import { expect, test } from "@playwright/test";

test("the Spanish Reina-Valera 1909 translation can be selected and read", async ({ page }) => {
  await page.goto("/word/");

  const translation = page.getByRole("combobox", { name: "Bible translation" });
  await expect(translation.locator("option")).toHaveCount(33);
  await translation.selectOption("RV1909");

  await expect(page.locator(".word-reading-heading > p")).toHaveText("Reina-Valera 1909 (Spanish)");
  await expect(page.locator("#word-verse-1")).toContainText("EN el principio crió Dios los cielos y la tierra.");
  await expect(page.locator(".word-source-note")).toContainText("eBible.org");

  await page.getByRole("combobox", { name: "Bible book" }).selectOption({ label: "John" });
  await page.getByRole("combobox", { name: "Bible chapter" }).selectOption("3");
  const verseSixteen = page.locator("#word-verse-16");
  await expect(verseSixteen).toContainText("Porque de tal manera amó Dios al mundo");
  await expect(verseSixteen.locator(".word-christ-words")).toContainText("Porque de tal manera amó Dios al mundo");

  await translation.selectOption("ARBVD");
  await expect(page.locator(".word-reading-heading > p")).toHaveText("Arabic Van Dyck Bible");
  await expect(page.locator(".word-verses")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#word-verse-16 .word-christ-words")).toBeVisible();
  await expect(page.locator(".word-source-note").getByRole("link", { name: "eBible.org" }))
    .toHaveAttribute("href", "https://ebible.org/details.php?id=arb-vd");
});

test("the mobile translation menu keeps Hebrew and Greek editions visible and readable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/word/");

  const mobileMenu = page.locator(".word-translation-mobile");
  await expect(mobileMenu).toBeVisible();
  await mobileMenu.locator("summary").click();

  const dropdown = mobileMenu.locator(".word-translation-dropdown");
  await expect(dropdown).toBeVisible();
  await expect(dropdown.getByRole("heading", { name: "Hebrew" })).toBeVisible();
  await expect(dropdown.getByRole("heading", { name: "Ancient Greek" })).toBeAttached();
  await expect(dropdown.getByRole("heading", { name: "Modern Greek" })).toBeAttached();
  await expect(dropdown.getByRole("button", { name: "Hebrew Old Testament (WLC)" })).toBeVisible();
  await expect(dropdown.getByRole("button", { name: "Septuagint (LXX, Old Testament)" })).toBeAttached();
  await expect(dropdown.getByRole("button", { name: "Greek Majority Text (New Testament)" })).toBeAttached();
  await expect(dropdown.getByRole("button", { name: "Vamvas Modern Greek Bible (1850)" })).toBeAttached();

  const dimensions = await dropdown.evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);

  await dropdown.getByRole("button", { name: "Hebrew Old Testament (WLC)" }).click();
  await expect(mobileMenu).not.toHaveAttribute("open", "");
  await expect(mobileMenu.locator("summary")).toContainText("Hebrew Old Testament (WLC)");
  await expect(page.locator(".word-verses")).toHaveAttribute("dir", "rtl");

  await mobileMenu.locator("summary").click();
  await dropdown.getByRole("button", { name: "Greek Majority Text (New Testament)" }).click();
  await expect(mobileMenu.locator("summary")).toContainText("Greek Majority Text (New Testament)");
  await expect(page.locator(".word-reading-heading > p")).toContainText("Greek");
});

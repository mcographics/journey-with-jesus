import { expect, test } from "@playwright/test";

test("the Spanish Reina-Valera 1909 translation can be selected and read", async ({ page }) => {
  await page.goto("/word/");

  const translation = page.getByRole("combobox", { name: "Bible translation" });
  await expect(translation.locator("option")).toHaveCount(14);
  await translation.selectOption("RV1909");

  await expect(page.locator(".word-reading-heading > p")).toHaveText("Reina-Valera 1909 (Spanish)");
  await expect(page.locator("#word-verse-1")).toContainText("EN el principio crió Dios los cielos y la tierra.");
  await expect(page.locator(".word-source-note")).toContainText("eBible.org");

  await page.getByRole("combobox", { name: "Bible book" }).selectOption({ label: "John" });
  await page.getByRole("combobox", { name: "Bible chapter" }).selectOption("3");
  const verseSixteen = page.locator("#word-verse-16");
  await expect(verseSixteen).toContainText("Porque de tal manera amó Dios al mundo");
  await expect(verseSixteen.locator(".word-christ-words")).toContainText("Porque de tal manera amó Dios al mundo");
});

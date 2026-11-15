import { expect, test } from "@playwright/test";

test("Contact Us is linked only in the shared footer and opens the contact form", async ({ page }) => {
  await page.goto("/company/");
  const footer = page.getByRole("navigation", { name: "Footer navigation" });
  const contact = footer.getByRole("link", { name: "Contact Us" });
  await expect(contact).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Contact Us" })).toHaveCount(1);
  await contact.click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.getByRole("heading", { name: "Contact Us", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Send a message" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Your name" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Subject" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Your message" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(1);
});

test("Contact form stays inside a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact/");
  await expect(page.getByRole("heading", { name: "Contact Us" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(390);
});

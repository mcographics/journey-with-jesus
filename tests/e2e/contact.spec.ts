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

test("Contact fields remain clickable and editable even if the message service is down", async ({ page }) => {
  await page.route("**/functions/v1/contact-inquiry", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ready: false }) });
    }
    return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "service_unavailable" }) });
  });

  await page.goto("/contact/");
  const name = page.getByRole("textbox", { name: "Your name" });
  const email = page.getByRole("textbox", { name: "Email address" });
  const subject = page.getByRole("textbox", { name: "Subject" });
  const message = page.getByRole("textbox", { name: "Your message" });
  const consent = page.getByRole("checkbox");
  const send = page.getByRole("button", { name: "Send message" });

  for (const field of [name, email, subject, message]) {
    await expect(field).toBeEnabled();
    await field.click();
  }
  await name.fill("Contact visitor");
  await email.fill("visitor@example.com");
  await subject.fill("Question about the studio");
  await message.fill("This is a test message, which should remain editable.");
  await expect(consent).toBeEnabled();
  await consent.check();
  await expect(send).toBeEnabled();
  await send.click();

  await expect(page.getByRole("alert")).toContainText(/not sent|could not be sent/i);
  await expect(name).toHaveValue("Contact visitor");
  await expect(message).toHaveValue("This is a test message, which should remain editable.");
  await expect(consent).toBeChecked();
});

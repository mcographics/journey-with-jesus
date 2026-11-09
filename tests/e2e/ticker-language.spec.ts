import { expect, test } from "@playwright/test";

const frenchVerses = [
  "« Venez à moi, vous tous qui êtes fatigués et chargés »",
  "« Je suis le chemin, la vérité, et la vie »",
  "« Je suis le bon berger »",
  "« Je suis la lumière du monde »",
  "« Demandez, et l’on vous donnera »",
  "« Que votre lumière luise ainsi devant les hommes »",
  "« Car là où est ton trésor, là aussi sera ton cœur »",
  "« Je vous donne un commandement nouveau »",
  "« Je vous laisse la paix, je vous donne ma paix »",
  "« Laissez venir à moi les petits enfants »",
  "« Cherchez premièrement le royaume et la justice de Dieu »",
];

const spanishVerses = [
  "« Venid á mí todos los que estáis trabajados y cargados »",
  "« Yo soy el camino, y la verdad, y la vida »",
  "« Yo soy el buen pastor »",
  "« Yo soy la luz del mundo »",
  "« Pedid, y se os dará »",
  "« Así alumbre vuestra luz delante de los hombres »",
  "« Porque donde estuviere vuestro tesoro, allí estará vuestro corazón »",
  "« Un mandamiento nuevo os doy »",
  "« La paz os dejo, mi paz os doy »",
  "« Dejad los niños venir, y no se lo estorbéis »",
  "« Mas buscad primeramente el reino de Dios »",
];

test("Journey with Jesus ticker scripture follows the selected site language", async ({ page }) => {
  await page.goto("/projects/journey-with-jesus/");
  const ticker = page.locator(".masthead-ticker-window");
  await expect(ticker).toContainText("Come unto me, all [ye] that labour and are heavy laden");

  await expect(page.locator(".desktop-utility-drawer")).toHaveAttribute("data-ready", "true");
  await page.mouse.move(page.viewportSize()!.width - 3, 35);
  await expect(page.locator(".desktop-utility-drawer")).toHaveClass(/is-open/);
  await page.locator(".site-language-toggle").click();
  await page.getByRole("option", { name: "Français [FR]" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  for (const verse of frenchVerses) await expect(ticker).toContainText(verse);
  for (const reference of ["Matthieu 11:28", "Jean 14:6", "Marc 10:14"]) {
    await expect(ticker).toContainText(reference);
  }
  await expect(ticker).toContainText("Récits bibliques");

  await page.locator(".site-language-toggle").click();
  await page.getByRole("option", { name: "Español [ES]" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  for (const verse of spanishVerses) await expect(ticker).toContainText(verse);
  for (const reference of ["Mateo 11:28", "Juan 14:6", "Marcos 10:14"]) {
    await expect(ticker).toContainText(reference);
  }
  await expect(ticker).toContainText("Historias bíblicas");

  await page.locator(".site-language-toggle").click();
  await page.locator(".site-language-option").first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(ticker).toContainText("Come unto me, all [ye] that labour and are heavy laden");
  await expect(ticker).toContainText("Matthew 11:28");
});

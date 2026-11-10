import { describe, expect, it } from "vitest";
import { registerBibleBookNameAliases, translateSiteText } from "@/data/site-translations";

describe("site language translations", () => {
  it("translates the mobile playlist controls", () => {
    expect(translateSiteText("View playlist", "fr")).toBe("Voir la liste de lecture");
    expect(translateSiteText("Hide playlist", "fr")).toBe("Masquer la liste de lecture");
    expect(translateSiteText("View playlist", "es")).toBe("Ver lista de reproducción");
    expect(translateSiteText("Hide playlist", "es")).toBe("Ocultar lista de reproducción");
  });

  it("localizes book names supplied by built-in editions in other languages", () => {
    const editionBookNames = Array.from({ length: 66 }, (_, index) => `Buch ${index + 1}`);
    registerBibleBookNameAliases(editionBookNames);

    expect(translateSiteText("Buch 1", "fr")).toBe("Genèse");
    expect(translateSiteText("Buch 66", "es")).toBe("Apocalipsis");

    registerBibleBookNameAliases(Array.from({ length: 39 }, (_, index) => `Tanakh ${index + 1}`));
    expect(translateSiteText("Tanakh 39", "fr")).toBe("Malachie");

    registerBibleBookNameAliases(Array.from({ length: 27 }, (_, index) => `Nuevo Testamento ${index + 1}`));
    expect(translateSiteText("Nuevo Testamento 1", "fr")).toBe("Matthieu");
  });

  it("keeps search result notices in the selected site language", () => {
    expect(translateSiteText("3 matches found.", "fr")).toBe("3 résultats trouvés.");
    expect(translateSiteText("No matches found for “grace”.", "es")).toBe("No se encontraron coincidencias para «grace».");
  });

  it("translates Journey with Jesus ticker scripture and verse references", () => {
    expect(translateSiteText("“Come unto me, all [ye] that labour and are heavy laden, and I will give you rest”", "fr"))
      .toBe("« Venez à moi, vous tous qui êtes fatigués et chargés »");
    expect(translateSiteText("“Come unto me, all [ye] that labour and are heavy laden, and I will give you rest”", "es"))
      .toBe("« Venid á mí todos los que estáis trabajados y cargados »");
    expect(translateSiteText("Matthew 11:28", "fr")).toBe("Matthieu 11:28");
    expect(translateSiteText("Matthew 11:28", "es")).toBe("Mateo 11:28");
    expect(translateSiteText("“Suffer the little children to come unto me”", "es"))
      .toBe("« Dejad los niños venir, y no se lo estorbéis »");
    expect(translateSiteText("Mark 10:14", "fr")).toBe("Marc 10:14");
  });
});

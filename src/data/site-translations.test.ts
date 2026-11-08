import { describe, expect, it } from "vitest";
import { registerBibleBookNameAliases, translateSiteText } from "@/data/site-translations";

describe("site language translations", () => {
  it("localizes book names supplied by built-in editions in other languages", () => {
    const editionBookNames = Array.from({ length: 66 }, (_, index) => `Buch ${index + 1}`);
    registerBibleBookNameAliases(editionBookNames);

    expect(translateSiteText("Buch 1", "fr")).toBe("Genèse");
    expect(translateSiteText("Buch 66", "es")).toBe("Apocalipsis");
  });

  it("keeps search result notices in the selected site language", () => {
    expect(translateSiteText("3 matches found.", "fr")).toBe("3 résultats trouvés.");
    expect(translateSiteText("No matches found for “grace”.", "es")).toBe("No se encontraron coincidencias para «grace».");
  });
});

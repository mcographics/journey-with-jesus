import { describe, expect, it } from "vitest";
import { orderPublicCharacters } from "@/lib/character-order";

type Character = { id: string; name: string };

describe("public character order", () => {
  it("keeps David immediately after Samson when loaded from the catalogue", () => {
    const characters: Character[] = [
      { id: "jesus-of-nazareth", name: "Jesus of Nazareth" },
      { id: "eric-oberhausen", name: "Eric" },
      { id: "adam", name: "Adam" },
      { id: "eve", name: "Eve" },
      { id: "samson", name: "Samson" },
      { id: "david", name: "David" },
      { id: "john-the-apostle", name: "John the Apostle" },
      { id: "john-the-baptist", name: "John the Baptist" },
    ];

    expect(orderPublicCharacters(characters, characters).map(({ id }) => id)).toEqual([
      "jesus-of-nazareth", "eric-oberhausen", "adam", "eve", "samson", "david", "john-the-apostle", "john-the-baptist",
    ]);
  });

  it("uses the database Eric entry and leaves the unpublished Mary dossier out of public results", () => {
    const defaults: Character[] = [
      { id: "jesus-of-nazareth", name: "Jesus of Nazareth" },
      { id: "eric-oberhausen", name: "Eric" },
    ];
    const rows: Character[] = [
      { id: "jesus-of-nazareth", name: "Jesus of Nazareth" },
      { id: "mary-mother-of-jesus", name: "Mary, Mother of Jesus" },
      { id: "eric-oberhausen", name: "Eric" },
      { id: "samson", name: "Samson" },
    ];

    expect(orderPublicCharacters(rows, defaults).map(({ id }) => id)).toEqual([
      "jesus-of-nazareth", "eric-oberhausen", "samson",
    ]);
  });
});

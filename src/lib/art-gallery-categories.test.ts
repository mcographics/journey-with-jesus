import { describe, expect, it } from "vitest";
import {
  ART_GALLERY_CATEGORIES,
  getAvailableGalleryCategories,
  getGalleryCategorySection,
} from "@/lib/art-gallery-categories";

describe("art gallery categories", () => {
  it("exposes the four selectable categories in the agreed order", () => {
    expect(ART_GALLERY_CATEGORIES).toEqual([
      "Characters",
      "Scenery & Locations",
      "Scenes & Moments",
      "Props & Details",
    ]);
  });

  it("keeps uncategorized and legacy images in Other", () => {
    expect(getGalleryCategorySection("")).toBe("Other");
    expect(getGalleryCategorySection("Artwork")).toBe("Other");
    expect(getGalleryCategorySection(null)).toBe("Other");
  });

  it("lists only sections that contain images and keeps Other at the end", () => {
    expect(getAvailableGalleryCategories([
      { category: "Scenes & Moments" },
      { category: "Characters" },
      { category: "Artwork" },
      { category: " " },
    ])).toEqual(["Characters", "Scenes & Moments", "Other"]);

    expect(getAvailableGalleryCategories([])).toEqual([]);
  });
});

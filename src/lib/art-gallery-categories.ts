export const ART_GALLERY_CATEGORIES = [
  "Characters",
  "Scenery & Locations",
  "Scenes & Moments",
  "Props & Details",
] as const;

export type ArtGalleryCategory = (typeof ART_GALLERY_CATEGORIES)[number];
export const OTHER_GALLERY_CATEGORY = "Other" as const;
export type GalleryCategorySection = ArtGalleryCategory | typeof OTHER_GALLERY_CATEGORY;

export function isArtGalleryCategory(value: string | null | undefined): value is ArtGalleryCategory {
  return typeof value === "string" && (ART_GALLERY_CATEGORIES as readonly string[]).includes(value.trim());
}

export function getGalleryCategorySection(value: string | null | undefined): GalleryCategorySection {
  if (isArtGalleryCategory(value)) return value.trim() as ArtGalleryCategory;
  return OTHER_GALLERY_CATEGORY;
}

export function getAvailableGalleryCategories(
  items: readonly { category: string | null | undefined }[],
): GalleryCategorySection[] {
  const present = new Set(items.map((item) => getGalleryCategorySection(item.category)));
  return [
    ...ART_GALLERY_CATEGORIES.filter((category) => present.has(category)),
    ...(present.has(OTHER_GALLERY_CATEGORY) ? [OTHER_GALLERY_CATEGORY] : []),
  ];
}

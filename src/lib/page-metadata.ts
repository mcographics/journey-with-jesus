import type { Metadata } from "next";
import { socialPreview } from "@/lib/share";

/** Keep search and social previews tied to the page being shared. */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Kerygma Path",
      title: `Kerygma Path | ${title}`,
      description,
      url: path,
      images: [socialPreview],
    },
    twitter: {
      card: "summary_large_image",
      images: [socialPreview],
      title: `Kerygma Path | ${title}`,
      description,
    },
  };
}

import type { Metadata } from "next";

/** Keep search and social previews tied to the page being shared. */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Kerygma Path",
      title: `${title} | Kerygma Path`,
      description,
      url: path,
    },
    twitter: {
      card: "summary",
      title: `${title} | Kerygma Path`,
      description,
    },
  };
}

import type { Metadata } from "next";
import { ArtGalleryExperience } from "@/components/ArtGalleryExperience";

export const metadata: Metadata = {
  title: "Art Gallery — Journey with Jesus",
  description: "Explore the visual collection from Journey with Jesus, a Kerygma Path project.",
  alternates: { canonical: "/projects/journey-with-jesus/art-gallery/" },
  openGraph: {
    title: "Art Gallery | Journey with Jesus",
    description: "Scenes, characters, and moments from the Journey with Jesus creative collection.",
    url: "/projects/journey-with-jesus/art-gallery/",
  },
};

export default function ArtGalleryPage() {
  return <ArtGalleryExperience />;
}

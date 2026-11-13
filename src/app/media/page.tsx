import type { Metadata } from "next";
import "../media-refresh.css";
import { MediaExperience } from "@/components/MediaExperience";
import { episodes, getPublishedEpisodes } from "@/data/episodes";

export const metadata: Metadata = {
  title: "Christian Animation Videos & Bible Stories",
  description:
    "Explore Kerygma Path's Christian animation videos, AI-assisted Bible storytelling and Gospel-centered stories inspired by the life of Jesus.",
  alternates: { canonical: "/media/" },
};

export default function MediaPage() {
  return <MediaExperience episodes={getPublishedEpisodes(episodes)} />;
}

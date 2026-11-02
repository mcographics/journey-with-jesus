import type { Metadata } from "next";
import { MediaExperience } from "@/components/MediaExperience";
import { episodes, getPublishedEpisodes } from "@/data/episodes";

export const metadata: Metadata = {
  title: "Media Library",
  description: "Watch animated stories inspired by Scripture and the life of Jesus.",
};

export default function MediaPage() {
  return <MediaExperience episodes={getPublishedEpisodes(episodes)} />;
}

import type { Metadata } from "next";
import "../media-refresh.css";
import { MediaExperience } from "@/components/MediaExperience";
import { episodes, getPublishedEpisodes } from "@/data/episodes";

export const metadata: Metadata = {
  title: "Christian Animation & Gospel Media",
  description: "Explore Kerygma Path’s Christian animation and Gospel media, including Journey with Jesus, a Scripture-inspired animation project about Jesus Christ.",
  alternates: { canonical: "/media/" },
};

export default function MediaPage() {
  return <MediaExperience episodes={getPublishedEpisodes(episodes)} />;
}

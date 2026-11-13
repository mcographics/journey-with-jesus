import { pageMetadata } from "@/lib/page-metadata";
import "../media-refresh.css";
import { MediaExperience } from "@/components/MediaExperience";
import { episodes, getPublishedEpisodes } from "@/data/episodes";

export const metadata = pageMetadata(
  "Christian Animation & Gospel Media",
  "Explore Kerygma Path’s Christian animation and Gospel media, including Journey with Jesus, a Scripture-inspired animation project about Jesus Christ.",
  "/media/",
);

export default function MediaPage() {
  return <MediaExperience episodes={getPublishedEpisodes(episodes)} />;
}

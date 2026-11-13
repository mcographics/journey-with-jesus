import { pageMetadata } from "@/lib/page-metadata";
import { ScriptureReader } from "@/components/ScriptureReader";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata = pageMetadata(
  "Bible Reader & Scripture Search",
  "Read and search the Bible through the Kerygma Path Scripture reader. Explore the Word alongside Journey with Jesus and Gospel storytelling.",
  "/word/",
);

export default function WordPage() {
  return <ScriptureReader scriptureBaseUrl={`${basePath}/scripture`} />;
}

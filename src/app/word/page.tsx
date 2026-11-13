import type { Metadata } from "next";
import { ScriptureReader } from "@/components/ScriptureReader";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Bible Reader & Scripture Search",
  description: "Read and search the Bible through the Kerygma Path Scripture reader. Explore the Word alongside Journey with Jesus and Gospel storytelling.",
  alternates: { canonical: "/word/" },
};

export default function WordPage() {
  return <ScriptureReader scriptureBaseUrl={`${basePath}/scripture`} />;
}

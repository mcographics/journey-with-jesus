import type { Metadata } from "next";
import { ScriptureReader } from "@/components/ScriptureReader";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "The Word",
  description: "Read and search the King James Version of the Bible in the Journey with Jesus Scripture reader.",
};

export default function WordPage() {
  return <ScriptureReader dataUrl={`${basePath}/scripture/kjv.json`} />;
}

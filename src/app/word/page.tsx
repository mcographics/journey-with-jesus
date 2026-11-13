import type { Metadata } from "next";
import { ScriptureReader } from "@/components/ScriptureReader";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Read the Bible — Scripture Reader",
  description:
    "Read and search Bible translations with the Kerygma Path Scripture reader, a companion to the Christian animated storytelling project Journey with Jesus.",
  alternates: { canonical: "/word/" },
};

export default function WordPage() {
  return <ScriptureReader scriptureBaseUrl={`${basePath}/scripture`} />;
}

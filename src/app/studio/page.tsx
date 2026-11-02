import type { Metadata } from "next";
import { StudioExperience } from "@/components/StudioExperience";

export const metadata: Metadata = {
  title: "Journey Studio",
  description: "Private video and community management for Journey with Jesus.",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <StudioExperience />;
}

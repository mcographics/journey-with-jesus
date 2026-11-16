import type { Metadata } from "next";
import { StudioExperience } from "@/components/StudioExperience";

export const metadata: Metadata = {
  title: "Kerygma Creative HQ",
  description: "Private creative studio and content management for Kerygma Path.",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return <StudioExperience />;
}

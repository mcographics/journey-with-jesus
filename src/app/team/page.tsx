import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { TeamDirectory } from "@/components/TeamDirectory";

export const metadata: Metadata = {
  title: "Meet the Team",
  description: "Meet the people bringing Journey with Jesus to life.",
};

const fallbackMembers = [
  {
    id: "eric-oberhausen",
    name: "Eric Oberhausen",
    role: "Founder",
    bio: "Eric Oberhausen is the founder of Journey with Jesus, an animated storytelling project sharing Scripture and the life of Jesus.",
    profile_image_url: null,
    sort_order: 1,
  },
  {
    id: "kenneth-salmon",
    name: "Kenneth Salmon",
    role: "Editor / Webmaster",
    bio: "Kenneth Salmon serves as Editor / Webmaster, editing site content and maintaining Journey with Jesus online.",
    profile_image_url: null,
    sort_order: 2,
  },
];

export default function TeamPage() {
  return (
    <main className="editorial-page team-page" id="main-content">
      <div className="editorial-container">
        <header className="editorial-heading">
          <p className="editorial-eyebrow"><Sparkles aria-hidden="true" size={15} /> The people behind the project</p>
          <h1>Meet the <em>Team</em></h1>
          <p className="editorial-intro">A small creative team sharing the stories of Scripture through thoughtful design and animation.</p>
        </header>

        <TeamDirectory fallbackMembers={fallbackMembers} />
        <p className="team-note">This project is made with care for the stories and the people who bring them to life.</p>
      </div>
    </main>
  );
}

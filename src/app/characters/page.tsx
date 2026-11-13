import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { CharacterCatalog } from "@/components/CharacterCatalog";

export const metadata: Metadata = {
  title: "Bible Characters in Journey with Jesus",
  description:
    "Meet Jesus, Mary, Peter and other Bible characters featured in Journey with Jesus, with Scripture references and Christian animation character stories.",
  alternates: { canonical: "/characters/" },
};

export default function CharactersPage() {
  return (
    <main className="editorial-page characters-page" id="main-content">
      <div className="editorial-container">
        <header className="editorial-heading">
          <p className="editorial-eyebrow"><ScrollText aria-hidden="true" size={15} /> Gospel character dossiers</p>
          <h1>Meet the <em>Characters</em></h1>
          <p className="editorial-intro">A guide to the people in the story, with passages that let you follow each one through Scripture.</p>
        </header>

        <CharacterCatalog />
        <p className="character-note">Passage references are starting points for your own reading of the biblical text.</p>
      </div>
    </main>
  );
}

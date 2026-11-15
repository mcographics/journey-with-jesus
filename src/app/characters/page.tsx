import { pageMetadata } from "@/lib/page-metadata";
import { ScrollText } from "lucide-react";
import { CharacterCatalog } from "@/components/CharacterCatalog";

export const metadata = pageMetadata(
  "Bible Characters & Gospel Stories",
  "Meet Eric, the story’s question-asking companion on the road with Jesus, and explore the Gospel characters and passages that shape the journey at Kerygma Path.",
  "/characters/",
);

export default function CharactersPage() {
  return (
    <main className="editorial-page characters-page" id="main-content">
      <div className="editorial-container">
        <header className="editorial-heading">
          <p className="editorial-eyebrow"><ScrollText aria-hidden="true" size={15} /> Gospel character dossiers</p>
          <h1>Meet the <em>Characters</em></h1>
          <p className="editorial-intro">Meet Eric, the original story’s question-asking companion on the road with Jesus, then explore the biblical characters and Gospel passages that shape each story.</p>
        </header>

        <CharacterCatalog />
        <p className="character-note">Passage references are starting points for your own reading of the biblical text.</p>
      </div>
    </main>
  );
}

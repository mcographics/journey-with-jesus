import type { Metadata } from "next";
import { BookOpen, ScrollText } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet the Characters",
  description: "Explore the people in the Gospel story and follow their stories through the Bible.",
};

const characters = [
  {
    name: "Jesus of Nazareth",
    role: "The centre of the Gospel story",
    summary: "Follow Jesus through His teaching, miracles, compassion, death, and resurrection in the four Gospel accounts.",
    passages: "Matthew 1–28 · Mark 1–16 · Luke 1–24 · John 1–21",
    position: "0% 0%",
  },
  {
    name: "Mary, Mother of Jesus",
    role: "A faithful presence in Jesus’ life",
    summary: "The Gospels introduce Mary at Jesus’ birth and show her trust, courage, and presence with the disciples.",
    passages: "Matthew 1–2 · Luke 1–2 · John 2:1–12; 19:25–27 · Acts 1:14",
    position: "50% 0%",
  },
  {
    name: "Simon Peter",
    role: "A fisherman and disciple",
    summary: "Peter’s journey includes bold declarations, painful failures, restoration, and a leading role among the early disciples.",
    passages: "Matthew 4:18–20; 16:13–19 · Luke 22:54–62 · John 21 · Acts 1–12",
    position: "100% 0%",
  },
  {
    name: "John the Baptist",
    role: "The voice preparing the way",
    summary: "John calls people to repentance, baptizes Jesus, and points others toward the one whose arrival he announces.",
    passages: "Matthew 3 · Mark 1:1–11 · Luke 1; 3 · John 1:19–34",
    position: "0% 100%",
  },
  {
    name: "Mary Magdalene",
    role: "A witness to the resurrection",
    summary: "Mary Magdalene follows Jesus, remains near the cross, and is among the first witnesses to the empty tomb.",
    passages: "Luke 8:1–3 · John 19:25 · John 20:1–18",
    position: "50% 100%",
  },
  {
    name: "The Beloved Disciple",
    role: "A witness in John’s Gospel",
    summary: "John’s Gospel uses this title for a close disciple who appears at key moments in Jesus’ final days and resurrection story.",
    passages: "John 13:23 · 19:26–27 · 20:2–8 · 21:7, 20–24",
    position: "100% 100%",
  },
] as const;

export default function CharactersPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const portraitSheet = `url("${basePath}/images/biblical-character-dossiers.webp")`;

  return (
    <main className="editorial-page characters-page" id="main-content">
      <div className="editorial-container">
        <header className="editorial-heading">
          <p className="editorial-eyebrow"><ScrollText aria-hidden="true" size={15} /> Gospel character dossiers</p>
          <h1>Meet the <em>Characters</em></h1>
          <p className="editorial-intro">A guide to the people in the story, with passages that let you follow each one through Scripture.</p>
        </header>

        <div className="character-grid">
          {characters.map((character, index) => (
            <article className="character-card" key={character.name}>
              <div
                aria-label={`Illustrated portrait of ${character.name}`}
                className="character-portrait"
                role="img"
                style={{ backgroundImage: portraitSheet, backgroundPosition: character.position }}
              >
                <span className="character-index">Dossier {String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="character-card-copy">
                <p className="character-role">{character.role}</p>
                <h2>{character.name}</h2>
                <p className="character-summary">{character.summary}</p>
                <div className="character-passages">
                  <BookOpen aria-hidden="true" size={15} />
                  <p><strong>Read in the Bible</strong><span>{character.passages}</span></p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="character-note">Passage references are starting points for your own reading of the biblical text.</p>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useId, useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import Image from "next/image";
import XrayReveal from "@/components/XrayReveal";
import type { Database } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type CharacterRow = Database["public"]["Tables"]["media_characters"]["Row"];
type PublicCharacter = Pick<CharacterRow, "id" | "name" | "role" | "summary" | "scripture_references" | "portrait_url">;

const defaults: PublicCharacter[] = [
  { id: "jesus-of-nazareth", name: "Jesus of Nazareth", role: "The centre of the Gospel story", summary: "Follow Jesus through His teaching, miracles, compassion, death, and resurrection in the four Gospel accounts.", scripture_references: "Matthew 1–28 · Mark 1–16 · Luke 1–24 · John 1–21", portrait_url: null },
  { id: "eric-oberhausen", name: "Eric", role: "The story’s main character", summary: "A curious traveler who follows Jesus, asks sincere questions, and grows in faith along the way.", scripture_references: "Matthew 7:7", portrait_url: null },
  { id: "simon-peter", name: "Simon Peter", role: "A fisherman and disciple", summary: "Peter’s journey includes bold declarations, painful failures, restoration, and a leading role among the early disciples.", scripture_references: "Matthew 4:18–20; 16:13–19 · Luke 22:54–62 · John 21 · Acts 1–12", portrait_url: null },
  { id: "john-the-baptist", name: "John the Baptist", role: "The voice preparing the way", summary: "John calls people to repentance, baptizes Jesus, and points others toward the one whose arrival he announces.", scripture_references: "Matthew 3 · Mark 1:1–11 · Luke 1; 3 · John 1:19–34", portrait_url: null },
  { id: "mary-magdalene", name: "Mary Magdalene", role: "A witness to the resurrection", summary: "Mary Magdalene follows Jesus, remains near the cross, and is among the first witnesses to the empty tomb.", scripture_references: "Luke 8:1–3 · John 19:25 · John 20:1–18", portrait_url: null },
  { id: "beloved-disciple", name: "The Beloved Disciple", role: "A witness in John’s Gospel", summary: "John’s Gospel uses this title for a close disciple who appears at key moments in Jesus’ final days and resurrection story.", scripture_references: "John 13:23 · 19:26–27 · 20:2–8 · 21:7, 20–24", portrait_url: null },
];

// Eric's original story and conversation now live inside the second dossier card.
function EricDossier() {
  return (
    <>
      <p className="character-role">The story’s main character</p>
      <h2>Eric</h2>
      <p className="eric-dossier-heading">A curious heart on the road with Jesus</p>
      <div className="eric-journey-backstory">
        <p>In this original, Scripture-inspired story, Eric is a thoughtful traveler with a sincere faith and questions he has never quite been able to settle. When he encounters Jesus, he joins Him on the road—through crowded streets, villages, and quiet stretches of wilderness—hoping to understand the words he has heard.</p>
        <p>As the journey unfolds, Eric asks about faith, purpose, suffering, forgiveness, and what it means to love his neighbour. He learns by listening to Jesus and seeing how He treats the people they meet: with mercy, truth, and compassion. Eric does not begin with every answer; he grows as he follows, finding that each conversation invites him to trust and take the next step.</p>
      </div>
      <div className="eric-journey-conversation" aria-label="A dramatized conversation inspired by Matthew 7:7">
        <p className="eric-journey-conversation-kicker">A conversation along the way</p>
        <p className="eric-dialogue-line"><span>Eric</span>“Jesus, how can I know the way when I still have so many questions?”</p>
        <p className="eric-dialogue-line eric-dialogue-jesus"><span>Jesus</span>“Ask, and it shall be given you; seek, and ye shall find.” <strong>Matthew 7:7</strong></p>
        <p className="eric-journey-conversation-note">An imagined exchange shaped by the words of Scripture.</p>
      </div>
    </>
  );
}

function isJesusCharacter(character: PublicCharacter): boolean {
  return character.id === "jesus-of-nazareth" || character.id === "jesus" ||
    ["jesus", "jesus of nazareth"].includes(character.name.trim().toLowerCase());
}

function isEricCharacter(character: PublicCharacter): boolean {
  return character.id === "eric-oberhausen" || character.id === "eric" ||
    character.name.trim().toLowerCase() === "eric";
}

function orderCharacterDossiers(rows: PublicCharacter[]): PublicCharacter[] {
  // Preserve the existing Jesus dossier, put Eric in Mary's former slot,
  // and omit any duplicate Eric or Mary record returned by the database.
  const source = rows.length ? rows : defaults;
  const jesus = source.find(isJesusCharacter) ?? defaults[0];
  const eric = defaults[1];
  const remaining = source.filter((character) =>
    !isJesusCharacter(character) &&
    !isEricCharacter(character) &&
    character.id !== "mary-mother-of-jesus" &&
    character.name.trim().toLowerCase() !== "mary, mother of jesus"
  );
  return [jesus, eric, ...remaining];
}

function CharacterCard({ character }: { character: PublicCharacter }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const toggle = () => setExpanded((current) => !current);
  const isJesus = isJesusCharacter(character);
  const isEric = isEricCharacter(character);
  const portraitSrc = isEric
    ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/eric-oberhausen-portrait.webp`
    : character.portrait_url;

  const portrait = portraitSrc ? (
    <Image
      className="character-portrait-image"
      src={portraitSrc}
      alt={character.name}
      fill
      sizes="(max-width: 700px) calc(100vw - 36px), (max-width: 900px) 50vw, 33vw"
      unoptimized
    />
  ) : (
    <span className="character-portrait-placeholder" aria-hidden="true">
      {character.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("")}
    </span>
  );

  return (
    <article className={`character-card${expanded ? " is-expanded" : ""}`}>
      <button
        type="button"
        className="character-portrait-trigger"
        aria-controls={detailsId}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Hide" : "Read"} the biography of ${character.name}${isJesus ? "; hover or double-tap to reveal the alternate portrait" : ""}`}
        onDoubleClick={() => {
          // Touchscreens use a single tap; on desktop the portrait uses a double-click.
          if (!window.matchMedia("(pointer: coarse)").matches) toggle();
        }}
        onClick={(event) => {
          // Keyboard/screen-reader activation and touch taps also work.
          if (event.detail === 0 || window.matchMedia("(pointer: coarse)").matches) toggle();
        }}
      >
        {isJesus ? (
          <XrayReveal
            className="character-xray-layer"
            imageFit="contain"
            imageSrc={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/jesus-character-xray.webp`}
          >
            {portrait}
          </XrayReveal>
        ) : (
          portrait
        )}
        {isEric && <span className="eric-character-portrait-label">Eric <span>· The journey begins</span></span>}
        <span className="character-portrait-cue">
          <span className="character-portrait-cue-desktop">{isJesus ? "Hover to reveal · " : ""}{expanded ? "Double-click to close" : "Double-click to read"}</span>
          <span className="character-portrait-cue-touch">{isJesus ? "Double-tap to reveal · " : ""}{expanded ? "Tap to close" : "Tap to read"}</span>
        </span>
      </button>
      <div className="character-card-copy" id={detailsId} aria-hidden={!expanded}>
        <button
          type="button"
          className="character-collapse-button"
          onClick={() => setExpanded(false)}
          tabIndex={expanded ? 0 : -1}
          aria-label={`Close biography of ${character.name}`}
        >
          <ChevronDown aria-hidden="true" size={16} />
          Close
        </button>
        {isEric ? <EricDossier /> : (
          <>
            <p className="character-role">{character.role}</p>
            <h2>{character.name}</h2>
            <p className="character-summary">{character.summary}</p>
            <div className="character-passages">
              <BookOpen aria-hidden="true" size={15} />
              <p><strong>Read in the Bible</strong><span>{character.scripture_references}</span></p>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export function CharacterCatalog() {
  const [characters, setCharacters] = useState<PublicCharacter[]>(() => orderCharacterDossiers(defaults));

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;
    let active = true;
    void client.from("media_characters")
      .select("id, name, role, summary, scripture_references, portrait_url")
      .eq("published", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (active && !error && data) setCharacters(orderCharacterDossiers(data));
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="character-grid">
      {characters.map((character) => (
        <CharacterCard character={character} key={character.id} />
      ))}
    </div>
  );
}

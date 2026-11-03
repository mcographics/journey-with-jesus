"use client";

import { useEffect, useId, useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import Image from "next/image";
import type { Database } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type CharacterRow = Database["public"]["Tables"]["media_characters"]["Row"];
type PublicCharacter = Pick<CharacterRow, "id" | "name" | "role" | "summary" | "scripture_references" | "portrait_url">;

const defaults: PublicCharacter[] = [
  { id: "jesus-of-nazareth", name: "Jesus of Nazareth", role: "The centre of the Gospel story", summary: "Follow Jesus through His teaching, miracles, compassion, death, and resurrection in the four Gospel accounts.", scripture_references: "Matthew 1–28 · Mark 1–16 · Luke 1–24 · John 1–21", portrait_url: null },
  { id: "mary-mother-of-jesus", name: "Mary, Mother of Jesus", role: "A faithful presence in Jesus’ life", summary: "The Gospels introduce Mary at Jesus’ birth and show her trust, courage, and presence with the disciples.", scripture_references: "Matthew 1–2 · Luke 1–2 · John 2:1–12; 19:25–27 · Acts 1:14", portrait_url: null },
  { id: "simon-peter", name: "Simon Peter", role: "A fisherman and disciple", summary: "Peter’s journey includes bold declarations, painful failures, restoration, and a leading role among the early disciples.", scripture_references: "Matthew 4:18–20; 16:13–19 · Luke 22:54–62 · John 21 · Acts 1–12", portrait_url: null },
  { id: "john-the-baptist", name: "John the Baptist", role: "The voice preparing the way", summary: "John calls people to repentance, baptizes Jesus, and points others toward the one whose arrival he announces.", scripture_references: "Matthew 3 · Mark 1:1–11 · Luke 1; 3 · John 1:19–34", portrait_url: null },
  { id: "mary-magdalene", name: "Mary Magdalene", role: "A witness to the resurrection", summary: "Mary Magdalene follows Jesus, remains near the cross, and is among the first witnesses to the empty tomb.", scripture_references: "Luke 8:1–3 · John 19:25 · John 20:1–18", portrait_url: null },
  { id: "beloved-disciple", name: "The Beloved Disciple", role: "A witness in John’s Gospel", summary: "John’s Gospel uses this title for a close disciple who appears at key moments in Jesus’ final days and resurrection story.", scripture_references: "John 13:23 · 19:26–27 · 20:2–8 · 21:7, 20–24", portrait_url: null },
];

function CharacterCard({ character }: { character: PublicCharacter }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const toggle = () => setExpanded((current) => !current);

  return (
    <article className={`character-card${expanded ? " is-expanded" : ""}`}>
      <button
        type="button"
        className="character-portrait-trigger"
        aria-controls={detailsId}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Hide" : "Read"} the biography of ${character.name}`}
        onDoubleClick={() => {
          // Touchscreens use a single tap; on desktop the portrait uses a double-click.
          if (!window.matchMedia("(pointer: coarse)").matches) toggle();
        }}
        onClick={(event) => {
          // Keyboard/screen-reader activation and touch taps also work.
          if (event.detail === 0 || window.matchMedia("(pointer: coarse)").matches) toggle();
        }}
      >
        {character.portrait_url ? (
          <Image
            className="character-portrait-image"
            src={character.portrait_url}
            alt={character.name}
            fill
            sizes="(max-width: 700px) calc(100vw - 36px), (max-width: 900px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <span className="character-portrait-placeholder" aria-hidden="true">
            {character.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("")}
          </span>
        )}
        <span className="character-portrait-cue">
          <span className="character-portrait-cue-desktop">{expanded ? "Double-click to close" : "Double-click to read"}</span>
          <span className="character-portrait-cue-touch">{expanded ? "Tap to close" : "Tap to read"}</span>
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
        <p className="character-role">{character.role}</p>
        <h2>{character.name}</h2>
        <p className="character-summary">{character.summary}</p>
        <div className="character-passages">
          <BookOpen aria-hidden="true" size={15} />
          <p><strong>Read in the Bible</strong><span>{character.scripture_references}</span></p>
        </div>
      </div>
    </article>
  );
}

export function CharacterCatalog() {
  const [characters, setCharacters] = useState<PublicCharacter[]>(defaults);

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;
    let active = true;
    void client.from("media_characters")
      .select("id, name, role, summary, scripture_references, portrait_url")
      .eq("published", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (active && !error && data) setCharacters(data);
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

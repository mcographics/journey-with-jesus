"use client";

import { useEffect, useId, useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import Image from "next/image";
import XrayReveal from "@/components/XrayReveal";
import { orderPublicCharacters } from "@/lib/character-order";
import type { Database } from "@/lib/database.types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type CharacterRow = Database["public"]["Tables"]["media_characters"]["Row"];
type PublicCharacter = Pick<CharacterRow, "id" | "name" | "role" | "summary" | "scripture_references" | "portrait_url">;

const defaults: PublicCharacter[] = [
  { id: "jesus-of-nazareth", name: "Jesus of Nazareth", role: "The centre of the Gospel story", summary: "Follow Jesus through His teaching, miracles, compassion, death, and resurrection in the four Gospel accounts.", scripture_references: "Matthew 1–28 · Mark 1–16 · Luke 1–24 · John 1–21", portrait_url: null },
  { id: "eric-oberhausen", name: "Eric", role: "The story’s main character", summary: "A curious traveler who follows Jesus, asks sincere questions, and grows in faith along the way.", scripture_references: "Matthew 7:7", portrait_url: null },
  { id: "adam", name: "Adam", role: "The First Man", summary: "Created by God from the dust of the ground and given the breath of life, Adam was the first man. Placed in the Garden of Eden, he was entrusted with caring for God’s creation. His story marks the beginning of humanity’s journey through creation, temptation, the Fall, and the need for redemption.", scripture_references: "Genesis 2–3", portrait_url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/adam-portrait.webp` },
  { id: "eve", name: "Eve", role: "The First Woman", summary: "Formed by God and brought to Adam, Eve was the first woman and his companion in the Garden of Eden. Her story includes the serpent’s temptation, the Fall, and the first generations of humanity beyond Eden.", scripture_references: "Genesis 2–4", portrait_url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/eve-portrait.webp` },
  { id: "samson", name: "Samson", role: "A Judge of Israel", summary: "Set apart from birth as a Nazirite, Samson was called to begin Israel’s deliverance from the Philistines. His great strength was matched by costly choices, and betrayal left him captive. In his final prayer, he asked God for strength once more.", scripture_references: "Judges 13–16", portrait_url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/samson-portrait.webp` },
  { id: "david", name: "David", role: "Shepherd, musician, and king of Israel", summary: "Chosen while tending his father’s sheep, David served Saul, faced Goliath, and later became king of Israel. His life holds courage, hardship, worship, and a lasting call to repentance.", scripture_references: "1 Samuel 16–17 · 2 Samuel 5; 11–12 · Psalms", portrait_url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/david-portrait.webp` },
  { id: "john-the-apostle", name: "John the Apostle", role: "Apostle of Jesus", summary: "The son of Zebedee and brother of James, John left his nets to follow Jesus. One of the Twelve, he witnessed key moments in Jesus’ ministry and became a steady witness to the risen Christ.", scripture_references: "Mark 1:19–20 · 5:37 · 9:2 · Galatians 2:9", portrait_url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/john-apostle-portrait.webp` },
  { id: "john-the-baptist", name: "John the Baptist", role: "The voice preparing the way", summary: "John calls people to repentance, baptizes Jesus, and points others toward the one whose arrival he announces.", scripture_references: "Matthew 3 · Mark 1:1–11 · Luke 1; 3 · John 1:19–34", portrait_url: null },
  { id: "mary-magdalene", name: "Mary Magdalene", role: "A witness to the resurrection", summary: "Mary Magdalene follows Jesus, remains near the cross, and is among the first witnesses to the empty tomb.", scripture_references: "Luke 8:1–3 · John 19:25 · John 20:1–18", portrait_url: null },
  { id: "beloved-disciple", name: "The Beloved Disciple", role: "A witness in John’s Gospel", summary: "John’s Gospel uses this title for a close disciple who appears at key moments in Jesus’ final days and resurrection story.", scripture_references: "John 13:23 · 19:26–27 · 20:2–8 · 21:7, 20–24", portrait_url: null },
];

// Eric's original story and conversation now live inside the second dossier card.
function EricDossier({ character }: { character: PublicCharacter }) {
  return (
    <>
      <p className="character-role">{character.role}</p>
      <h2>{character.name}</h2>
      <p className="eric-dossier-heading">A curious heart on the road with Jesus</p>
      <div className="eric-journey-backstory">
        <p>{character.summary}</p>
        <p>As the journey unfolds, Eric asks about faith, purpose, suffering, forgiveness, and what it means to love his neighbour. He learns by listening to Jesus and seeing how He treats the people they meet: with mercy, truth, and compassion. Eric does not begin with every answer; he grows as he follows, finding that each conversation invites him to trust and take the next step.</p>
      </div>
      <div className="eric-journey-conversation" aria-label="A dramatized conversation inspired by Matthew 7:7">
        <p className="eric-journey-conversation-kicker">A conversation along the way</p>
        <p className="eric-dialogue-line"><span>Eric</span>“Jesus, how can I know the way when I still have so many questions?”</p>
        <p className="eric-dialogue-line eric-dialogue-jesus"><span>Jesus</span>“Ask, and it shall be given you; seek, and ye shall find.” <strong>Matthew 7:7</strong></p>
        <p className="eric-journey-conversation-note">An imagined exchange shaped by Scripture. Read in the Bible: <strong>{character.scripture_references}</strong></p>
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

function CharacterCard({ character }: { character: PublicCharacter }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const toggle = () => setExpanded((current) => !current);
  const isJesus = isJesusCharacter(character);
  const isEric = isEricCharacter(character);
  const isPortrait = isJesus || isEric || ["adam", "eve", "samson", "david", "john-the-apostle"].includes(character.id);
  const portraitSrc = isJesus
    ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/jesus-character-primary.webp`
    : isEric
      ? character.portrait_url ?? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/eric-oberhausen-portrait.webp`
      : character.portrait_url;
  const portraitSrcSet = portraitSrc && /\/images\/(eric-oberhausen-portrait|adam-portrait|eve-portrait|samson-portrait|david-portrait|john-apostle-portrait)\.webp$/.test(portraitSrc)
    ? [480, 720, 941].map((width) => `${portraitSrc.replace(/\.webp$/, `-${width}.webp`)} ${width}w`).join(", ")
    : null;
  const portraitSizes = "(max-width: 560px) calc(100vw - 36px), (max-width: 700px) 560px, (max-width: 900px) calc((100vw - 76px) / 2), (max-width: 1100px) calc((100vw - 96px) / 3), 360px";

  const portrait = portraitSrc ? (
    <picture className="character-portrait-picture">
      {portraitSrcSet && <source type="image/webp" srcSet={portraitSrcSet} sizes={portraitSizes} />}
      <Image
        className="character-portrait-image"
        src={portraitSrc}
        alt={character.name}
        fill
        sizes={portraitSizes}
        unoptimized
      />
    </picture>
  ) : (
    <span className="character-portrait-placeholder" aria-hidden="true">
      {character.name.split(/\s+/).map((word) => word[0]).slice(0, 2).join("")}
    </span>
  );

  return (
    <article className={`character-card${isPortrait ? " is-portrait" : ""}${expanded ? " is-expanded" : ""}`}>
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
        {isEric ? <EricDossier character={character} /> : (
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
  const [characters, setCharacters] = useState<PublicCharacter[]>(() => orderPublicCharacters(defaults, defaults));

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;
    let active = true;
    void client.from("media_characters")
      .select("id, name, role, summary, scripture_references, portrait_url")
      .eq("published", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (active && !error && data) setCharacters(orderPublicCharacters(data, defaults));
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

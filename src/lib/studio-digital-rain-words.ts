/** Spotlight Scripture words in the Creative HQ digital rain, with English glosses. */
export type ScriptureWord = {
  original: string;
  english: string;
  hebrew?: boolean;
};

export const scriptureWords: ScriptureWord[] = [
  { original: "Ἰησοῦς", english: "Jesus" },
  { original: "Χριστός", english: "Christ" },
  { original: "κύριος", english: "Lord" },
  { original: "ἀγάπη", english: "Love" },
  { original: "φῶς", english: "Light" },
  { original: "ζωή", english: "Life" },
  { original: "ἀλήθεια", english: "Truth" },
  { original: "ἔλεος", english: "Mercy" },
  { original: "ἅγιος", english: "Holy" },
  { original: "χάρις", english: "Grace" },
  { original: "εἰρήνη", english: "Peace" },
  { original: "ישוע", english: "Jesus", hebrew: true },
  { original: "משיח", english: "Messiah", hebrew: true },
  { original: "אהבה", english: "Love", hebrew: true },
  { original: "שלום", english: "Peace", hebrew: true },
  { original: "חסד", english: "Steadfast Love", hebrew: true },
  { original: "אור", english: "Light", hebrew: true },
  { original: "קדוש", english: "Holy", hebrew: true },
  { original: "אמת", english: "Truth", hebrew: true },
];

/* Each language has an equal 2.7-second full-opacity reading hold. */
export const wordRevealTiming = {
  fadeInMs: 380,
  holdMs: 2700,
  sweepMs: 850,
  fadeOutMs: 550,
} as const;

export const wordRevealDurationMs =
  wordRevealTiming.fadeInMs + wordRevealTiming.holdMs * 2 +
  wordRevealTiming.sweepMs + wordRevealTiming.fadeOutMs;

export type WordRevealFrame = {
  stage: "original" | "reveal" | "english";
  sweepProgress: number;
  opacity: number;
};

export function getWordRevealFrame(elapsedMs: number): WordRevealFrame {
  const elapsed = Math.max(0, elapsedMs);
  const sweepStart = wordRevealTiming.fadeInMs + wordRevealTiming.holdMs;
  const sweepEnd = sweepStart + wordRevealTiming.sweepMs;
  const stage = elapsed < sweepStart ? "original" : elapsed < sweepEnd ? "reveal" : "english";
  const sweepProgress = Math.max(0, Math.min(1, (elapsed - sweepStart) / wordRevealTiming.sweepMs));
  const opacity = Math.max(0, Math.min(
    1,
    elapsed / wordRevealTiming.fadeInMs,
    (wordRevealDurationMs - elapsed) / wordRevealTiming.fadeOutMs,
  ));
  return { stage, sweepProgress, opacity };
}

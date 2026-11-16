/** Words featured in the Studio login's decorative digital rain.
 * Translations are intentionally short, readable English glosses. */
export type StudioWord = {
  text: string;
  english: string;
  hebrew?: boolean;
};

export const SCRIPTURAL_WORDS: readonly StudioWord[] = [
  { text: "Ἰησοῦς", english: "Jesus" },
  { text: "Χριστός", english: "Christ" },
  { text: "κύριος", english: "Lord" },
  { text: "ἀγάπη", english: "Love" },
  { text: "φῶς", english: "Light" },
  { text: "ζωή", english: "Life" },
  { text: "ἀλήθεια", english: "Truth" },
  { text: "ἔλεος", english: "Mercy" },
  { text: "ἅγιος", english: "Holy" },
  { text: "χάρις", english: "Grace" },
  { text: "εἰρήνη", english: "Peace" },
  { text: "ישוע", english: "Jesus", hebrew: true },
  { text: "משיח", english: "Messiah", hebrew: true },
  { text: "אהבה", english: "Love", hebrew: true },
  { text: "שלום", english: "Peace", hebrew: true },
  { text: "חסד", english: "Steadfast love", hebrew: true },
  { text: "אור", english: "Light", hebrew: true },
  { text: "קדוש", english: "Holy", hebrew: true },
  { text: "אמת", english: "Truth", hebrew: true },
];

/* Each language receives the same uninterrupted reading time. The
 * transition sits between the two holds, rather than cutting either short. */
export const WORD_FADE_IN_MS = 320;
export const WORD_HOLD_MS = 2600;
export const WORD_LIGHT_SWEEP_MS = 900;
export const WORD_FADE_OUT_MS = 480;
export const WORD_DURATION_MS =
  WORD_FADE_IN_MS + WORD_HOLD_MS * 2 + WORD_LIGHT_SWEEP_MS + WORD_FADE_OUT_MS;

export type WordRevealState = {
  stage: "original" | "sweep" | "english" | "done";
  alpha: number;
  sweepProgress: number;
};

export function getWordRevealState(elapsedMs: number): WordRevealState {
  const elapsed = Math.max(0, elapsedMs);
  const originalHoldEnd = WORD_FADE_IN_MS + WORD_HOLD_MS;
  const sweepEnd = originalHoldEnd + WORD_LIGHT_SWEEP_MS;
  const englishHoldEnd = sweepEnd + WORD_HOLD_MS;

  if (elapsed < WORD_FADE_IN_MS) {
    return { stage: "original", alpha: elapsed / WORD_FADE_IN_MS, sweepProgress: 0 };
  }
  if (elapsed < originalHoldEnd) {
    return { stage: "original", alpha: 1, sweepProgress: 0 };
  }
  if (elapsed < sweepEnd) {
    return {
      stage: "sweep",
      alpha: 1,
      sweepProgress: (elapsed - originalHoldEnd) / WORD_LIGHT_SWEEP_MS,
    };
  }
  if (elapsed < englishHoldEnd) {
    return { stage: "english", alpha: 1, sweepProgress: 1 };
  }
  if (elapsed < WORD_DURATION_MS) {
    return {
      stage: "english",
      alpha: Math.max(0, 1 - (elapsed - englishHoldEnd) / WORD_FADE_OUT_MS),
      sweepProgress: 1,
    };
  }
  return { stage: "done", alpha: 0, sweepProgress: 1 };
}

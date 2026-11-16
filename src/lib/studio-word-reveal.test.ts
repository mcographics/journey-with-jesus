import { describe, expect, it } from "vitest";
import {
  SCRIPTURAL_WORDS,
  WORD_DURATION_MS,
  WORD_FADE_IN_MS,
  WORD_HOLD_MS,
  WORD_LIGHT_SWEEP_MS,
  getWordRevealState,
} from "./studio-word-reveal";

describe("Studio scripture language reveal", () => {
  it("provides a nonempty English translation for every Greek and Hebrew word", () => {
    expect(SCRIPTURAL_WORDS).toHaveLength(19);
    for (const word of SCRIPTURAL_WORDS) {
      expect(word.text.trim()).not.toBe("");
      expect(word.english.trim()).not.toBe("");
    }
    expect(SCRIPTURAL_WORDS.some((word) => word.hebrew)).toBe(true);
    expect(SCRIPTURAL_WORDS.some((word) => !word.hebrew)).toBe(true);
  });

  it("holds original and English words equally for 2.6 seconds", () => {
    const originalStart = WORD_FADE_IN_MS;
    const sweepStart = originalStart + WORD_HOLD_MS;
    const englishStart = sweepStart + WORD_LIGHT_SWEEP_MS;
    expect(WORD_HOLD_MS).toBe(2600);
    expect(getWordRevealState(originalStart)).toEqual({ stage: "original", alpha: 1, sweepProgress: 0 });
    expect(getWordRevealState(sweepStart - 1).stage).toBe("original");
    expect(getWordRevealState(sweepStart).stage).toBe("sweep");
    expect(getWordRevealState(englishStart - 1).stage).toBe("sweep");
    expect(getWordRevealState(englishStart).stage).toBe("english");
    expect(getWordRevealState(englishStart + WORD_HOLD_MS - 1).alpha).toBe(1);
  });

  it("sweeps smoothly across the letters, then fades out", () => {
    const sweepStart = WORD_FADE_IN_MS + WORD_HOLD_MS;
    expect(getWordRevealState(sweepStart + WORD_LIGHT_SWEEP_MS / 2)).toEqual({
      stage: "sweep",
      alpha: 1,
      sweepProgress: 0.5,
    });
    expect(getWordRevealState(WORD_DURATION_MS - 1).alpha).toBeLessThan(0.01);
    expect(getWordRevealState(WORD_DURATION_MS)).toEqual({ stage: "done", alpha: 0, sweepProgress: 1 });
  });
});

import { describe, expect, it } from "vitest";
import { getWordRevealFrame, scriptureWords, wordRevealDurationMs, wordRevealTiming } from "./studio-digital-rain-words";

describe("Creative HQ Scripture word reveal", () => {
  it("pairs all Hebrew and Greek words with an English gloss", () => {
    expect(scriptureWords).toHaveLength(19);
    for (const word of scriptureWords) {
      expect(word.original.trim()).not.toBe("");
      expect(word.english.trim()).not.toBe("");
      expect(word.original).not.toBe(word.english);
    }
    expect(scriptureWords.find((word) => word.original === "Ἰησοῦς")?.english).toBe("Jesus");
    expect(scriptureWords.find((word) => word.original === "ישוע")?.english).toBe("Jesus");
    expect(scriptureWords.find((word) => word.original === "חסד")?.english).toBe("Steadfast Love");
  });
  it("holds both language stages for the same full 2.7 seconds", () => {
    const { fadeInMs, holdMs, sweepMs, fadeOutMs } = wordRevealTiming;
    expect(holdMs).toBe(2700);
    expect(wordRevealDurationMs).toBe(fadeInMs + holdMs * 2 + sweepMs + fadeOutMs);
    expect(getWordRevealFrame(fadeInMs).stage).toBe("original");
    expect(getWordRevealFrame(fadeInMs + holdMs - 1).stage).toBe("original");
    expect(getWordRevealFrame(fadeInMs + holdMs + sweepMs).stage).toBe("english");
    expect(getWordRevealFrame(fadeInMs + holdMs + sweepMs + holdMs - 1).stage).toBe("english");
  });
  it("tracks the moving translation reveal from left to right", () => {
    const { fadeInMs, holdMs, sweepMs } = wordRevealTiming;
    const start = fadeInMs + holdMs;
    expect(getWordRevealFrame(start)).toMatchObject({ stage: "reveal", sweepProgress: 0, opacity: 1 });
    expect(getWordRevealFrame(start + sweepMs / 2)).toMatchObject({ stage: "reveal", sweepProgress: .5, opacity: 1 });
    expect(getWordRevealFrame(start + sweepMs)).toMatchObject({ stage: "english", sweepProgress: 1, opacity: 1 });
  });
  it("fades the spotlight in and away without lingering on canvas", () => {
    expect(getWordRevealFrame(0).opacity).toBe(0);
    expect(getWordRevealFrame(wordRevealTiming.fadeInMs).opacity).toBe(1);
    expect(getWordRevealFrame(wordRevealDurationMs - wordRevealTiming.fadeOutMs / 2).opacity).toBe(.5);
    expect(getWordRevealFrame(wordRevealDurationMs).opacity).toBe(0);
  });
});

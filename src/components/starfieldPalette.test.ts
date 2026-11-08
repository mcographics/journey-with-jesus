import { describe, expect, it } from "vitest";
import { chooseStarTint, starGlint } from "./starfieldPalette";

describe("gateway star glints", () => {
  it("keeps most stars white with a small blue/gold selection", () => {
    expect(chooseStarTint(0)).toBe("blue");
    expect(chooseStarTint(0.0749)).toBe("blue");
    expect(chooseStarTint(0.075)).toBe("gold");
    expect(chooseStarTint(0.1499)).toBe("gold");
    expect(chooseStarTint(0.15)).toBe("white");
    expect(chooseStarTint(0.9)).toBe("white");
  });

  it("gives each tinted star a brief phase-offset flash", () => {
    expect(starGlint(0, 0)).toBe(0);
    expect(starGlint(0, Math.PI / 2)).toBeCloseTo(1, 8);
    expect(starGlint(0, Math.PI)).toBeCloseTo(0, 8);
    expect(starGlint(0.2, 0)).toBeGreaterThan(0);
    expect(starGlint(0.2, Math.PI)).toBe(0);
  });
});

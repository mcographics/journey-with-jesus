/** Star accents for the existing Kerygma Path gateway starfield.
 * Most stars remain white. Rare stars briefly catch blue or gold light.
 * An injected sample keeps palette selection simple to test.
 */
export type StarTint = "white" | "blue" | "gold";

export function chooseStarTint(sample: number): StarTint {
  if (sample < 0.075) return "blue";
  if (sample < 0.15) return "gold";
  return "white";
}

/** Narrow, smooth light flashes; they drift at individual random phases. */
export function starGlint(time: number, phase: number): number {
  return Math.pow(Math.max(0, Math.sin(time * 2.15 + phase)), 8);
}

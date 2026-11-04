/**
 * Conservative, server-side first-pass moderation. Never publish automatically:
 * accepted comments still enter the existing pending-review queue.
 * Review this list regularly; no keyword list can reliably detect all hate speech.
 */
export type ModerationResult =
  | { action: "reject"; reason: "profanity" | "hate" | "threat" | "harassment" }
  | { action: "review" };

const profanity = [
  "fuck", "fucking", "fucker", "shit", "bullshit", "bitch", "bastard",
  "asshole", "motherfucker", "cunt", "dickhead", "piss", "damn", "crap",
];
const slurs = [
  "nigger", "nigga", "faggot", "kike", "spic", "chink", "gook", "raghead",
  "tranny", "retard",
];
const threats = [
  /\b(?:i(?:'| a)?m going to|i will|i'll)\s+(?:kill|hurt|beat|attack)\s+(?:you|him|her|them)\b/,
  /\b(?:kill yourself|go kill yourself|kys)\b/,
];
const targetedHarassment = [
  /\b(?:you(?:'re| are)?|ur)\s+(?:a\s+)?(?:worthless|disgusting|stupid|idiot|moron|trash)\b/,
  /\b(?:shut up|nobody wants you here)\b/,
];

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@]/g, "a").replace(/[0]/g, "o").replace(/[1!]/g, "i")
    .replace(/[3]/g, "e").replace(/[$5]/g, "s").replace(/[7]/g, "t")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ").trim();
}
function containsWord(text: string, words: string[]): boolean {
  return words.some((word) => new RegExp(`\\b${word}\\b`, "i").test(text));
}
export function screenComment(text: string): ModerationResult {
  const normalized = normalize(text);
  if (containsWord(normalized, slurs)) return { action: "reject", reason: "hate" };
  if (containsWord(normalized, profanity)) return { action: "reject", reason: "profanity" };
  if (threats.some((pattern) => pattern.test(normalized))) return { action: "reject", reason: "threat" };
  if (targetedHarassment.some((pattern) => pattern.test(normalized))) return { action: "reject", reason: "harassment" };
  return { action: "review" };
}

import { describe, expect, it } from "vitest";
import { screenComment } from "../../supabase/functions/_shared/moderation";

describe("server-side comment moderation", () => {
  it.each([
    ["This is fucking awful", "profanity"],
    ["You are a nigger", "hate"],
    ["I will kill you", "threat"],
    ["You are worthless", "harassment"],
    ["shut up", "harassment"],
    ["What the sh1t", "profanity"],
  ])("rejects abuse: %s", (comment, reason) => {
    expect(screenComment(comment)).toEqual({ action: "reject", reason });
  });
  it.each([
    "I'm struggling with my faith and feeling depressed.",
    "I am angry about what happened and need prayer.",
    "I'm grieving and feel hopeless.",
    "I disagree with this interpretation of scripture.",
    "I need help because someone is bullying me.",
  ])("does not reject vulnerable or respectful comments: %s", (comment) => {
    expect(screenComment(comment)).toEqual({ action: "review" });
  });
});

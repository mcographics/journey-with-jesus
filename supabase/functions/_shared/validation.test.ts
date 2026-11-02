import { describe, expect, it } from "vitest";
import { validateCommentPayload } from "./validation";

describe("comment payload validation", () => {
  it("normalizes and trims valid visitor input", () => {
    const result = validateCommentPayload({
      episodeId: "jesus-calms-the-storm",
      displayName: "  Alex  ",
      body: "  This story gave me hope.  ",
      website: "",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        episodeId: "jesus-calms-the-storm",
        displayName: "Alex",
        body: "This story gave me hope.",
        honeypot: "",
      },
    });
  });

  it("rejects honeypot submissions, invalid episode IDs, and oversized comments", () => {
    expect(validateCommentPayload({ episodeId: "bad id", displayName: "Alex", body: "A valid comment", website: "bot" }).ok).toBe(false);
    expect(validateCommentPayload({ episodeId: "story", displayName: "Alex", body: "A valid comment", website: "fill" }).ok).toBe(false);
    expect(validateCommentPayload({ episodeId: "story", displayName: "Alex", body: "x".repeat(2001), website: "" }).ok).toBe(false);
  });
});

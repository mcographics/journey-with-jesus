import { describe, expect, it } from "vitest";
import { SOCIAL_PLATFORM_ITEMS, SOCIAL_PLATFORM_LABELS, socialPlatformUrlError } from "./social-platforms";

describe("Journey Studio social platforms", () => {
  it("offers at least 80 unique choices including Bluesky and Rumble", () => {
    const ids = SOCIAL_PLATFORM_ITEMS.map((item) => item.id);
    expect(ids.length).toBeGreaterThanOrEqual(80);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SOCIAL_PLATFORM_LABELS.bluesky).toBe("Bluesky");
    expect(SOCIAL_PLATFORM_LABELS.rumble).toBe("Rumble");
  });

  it.each([
    ["youtube", "https://www.youtube.com/@KerygmaPath"],
    ["facebook", "https://www.facebook.com/KerygmaPath"],
    ["threads", "https://www.threads.com/@kerygma_Path"],
    ["bluesky", "https://bsky.app/profile/kerygmapath.bsky.social"],
    ["rumble", "https://rumble.com/c/your-channel"],
    ["discord", "https://discord.gg/example"],
    ["mastodon", "https://example.social/@KerygmaPath"],
    ["custom", "https://kerygmapath.com"],
  ] as const)("accepts a matching %s link", (platform, url) => {
    expect(socialPlatformUrlError(platform, url)).toBeNull();
  });

  it("rejects a URL for the wrong platform, misleading host, or insecure protocol", () => {
    expect(socialPlatformUrlError("bluesky", "https://rumble.com/c/example")).toContain("Bluesky");
    expect(socialPlatformUrlError("rumble", "https://bsky.app/profile/example")).toContain("Rumble");
    expect(socialPlatformUrlError("bluesky", "https://bsky.app.evil.example")).toContain("Bluesky");
    expect(socialPlatformUrlError("youtube", "http://youtube.com/@example")).toContain("HTTPS");
  });
});

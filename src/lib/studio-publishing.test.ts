import { describe, expect, it } from "vitest";
import { resolveStoryPublication } from "./studio-publishing";

describe("Journey Studio story publishing", () => {
  it("saves as a draft when the video has not been uploaded", () => {
    expect(resolveStoryPublication(true, false, null)).toEqual({ published: false, savedAsDraft: true });
  });
  it("publishes YouTube links without direct uploads", () => {
    expect(resolveStoryPublication(true, false, "dQw4w9WgXcQ")).toEqual({ published: true, savedAsDraft: false });
  });
  it("publishes an uploaded video without YouTube", () => {
    expect(resolveStoryPublication(true, true, null)).toEqual({ published: true, savedAsDraft: false });
  });
  it("keeps an intentional draft unpublished", () => {
    expect(resolveStoryPublication(false, false, null)).toEqual({ published: false, savedAsDraft: false });
  });
  it("accepts both video sources", () => {
    expect(resolveStoryPublication(true, true, "dQw4w9WgXcQ")).toEqual({ published: true, savedAsDraft: false });
  });
});

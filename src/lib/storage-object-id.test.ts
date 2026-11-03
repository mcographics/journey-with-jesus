import { describe, expect, it, vi } from "vitest";
import { createStorageObjectId } from "@/lib/storage-object-id";

describe("createStorageObjectId", () => {
  it("uses randomUUID when the browser provides it", () => {
    const randomUUID = vi.fn(() => "00000000-0000-4000-8000-000000000000" as const);
    const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(0x11));

    expect(createStorageObjectId({ randomUUID, getRandomValues })).toBe("00000000-0000-4000-8000-000000000000");
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it("uses getRandomValues when randomUUID is unavailable on an insecure origin", () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(0xab));

    expect(createStorageObjectId({ getRandomValues })).toBe("ab".repeat(16));
    expect(getRandomValues).toHaveBeenCalledOnce();
  });

  it("still creates a path segment when Web Crypto is unavailable", () => {
    expect(createStorageObjectId(null)).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});

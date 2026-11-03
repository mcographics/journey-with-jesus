/**
 * Create a unique storage path segment on secure and non-secure origins.
 * `crypto.randomUUID()` is unavailable on HTTP custom domains, while
 * `getRandomValues()` remains available in those browser contexts.
 */
export function createStorageObjectId(
  cryptoApi: (Pick<Crypto, "getRandomValues"> & Partial<Pick<Crypto, "randomUUID">>) | null = globalThis.crypto,
): string {
  const uuid = cryptoApi?.randomUUID?.();
  if (uuid) return uuid;

  if (cryptoApi?.getRandomValues) {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

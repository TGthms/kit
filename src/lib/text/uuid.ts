function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  if (!globalThis.crypto?.getRandomValues) throw new Error("crypto.getRandomValues is required");
  globalThis.crypto.getRandomValues(out);
  return out;
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateUuid(version: 4 | 7 = 4): string {
  if (version === 4 && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const b = randomBytes(16);
  if (version === 4) {
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
  } else {
    const ms = Date.now();
    b[0] = (ms / 2 ** 40) & 0xff;
    b[1] = (ms / 2 ** 32) & 0xff;
    b[2] = (ms / 2 ** 24) & 0xff;
    b[3] = (ms / 2 ** 16) & 0xff;
    b[4] = (ms / 2 ** 8) & 0xff;
    b[5] = ms & 0xff;
    b[6] = (b[6] & 0x0f) | 0x70;
    b[8] = (b[8] & 0x3f) | 0x80;
  }
  const h = hex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function generateUuids(count: number, version: 4 | 7 = 4): string[] {
  const n = Math.max(1, Math.min(1000, Math.floor(count) || 1));
  return Array.from({ length: n }, () => generateUuid(version));
}

import { md5Bytes } from "./md5";

export type HashAlgo = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export const HASH_ALGOS: HashAlgo[] = ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

export async function hashBytes(data: Uint8Array, algo: HashAlgo): Promise<string> {
  if (algo === "MD5") return bytesToHex(md5Bytes(data));
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is not available");
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const digest = await subtle.digest(algo, copy);
  return bytesToHex(new Uint8Array(digest));
}

export async function hashText(text: string, algo: HashAlgo): Promise<string> {
  return hashBytes(new TextEncoder().encode(text), algo);
}

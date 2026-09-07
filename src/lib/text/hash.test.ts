import { describe, expect, it } from "vitest";
import { bytesToHex, hashBytes, hashText } from "./hash";

describe("bytesToHex", () => {
  it("zero-pads each byte", () => {
    expect(bytesToHex(new Uint8Array([0x00, 0x0a, 0xff]))).toBe("000aff");
  });
});

describe("hashText / hashBytes", () => {
  // Vectors cross-checked with Node crypto for "abc".
  it.each([
    ["MD5", "900150983cd24fb0d6963f7d28e17f72"],
    ["SHA-1", "a9993e364706816aba3e25717850c26c9cd0d89d"],
    ["SHA-256", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    [
      "SHA-512",
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    ],
  ] as const)("hashes 'abc' with %s", async (algo, expected) => {
    expect(await hashText("abc", algo)).toBe(expected);
    expect(await hashBytes(new TextEncoder().encode("abc"), algo)).toBe(expected);
  });

  it("hashes the empty string with SHA-256", async () => {
    expect(await hashText("", "SHA-256")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });
});

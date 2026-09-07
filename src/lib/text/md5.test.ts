import { describe, expect, it } from "vitest";
import { md5Bytes, md5Hex } from "./md5";

// RFC 1321 §A.5 test vectors, plus longer/multibyte cases cross-checked
// against Node's crypto.createHash("md5").
const RFC_1321: Array<[string, string]> = [
  ["", "d41d8cd98f00b204e9800998ecf8427e"],
  ["a", "0cc175b9c0f1b6a831c399e269772661"],
  ["abc", "900150983cd24fb0d6963f7d28e17f72"],
  ["message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
  ["abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b"],
  [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    "d174ab98d277d9f5a5611c2c9f419d9f",
  ],
  [
    "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
    "57edf4a22be3c955ac49da2e2107b67a",
  ],
];

describe("md5Hex", () => {
  it.each(RFC_1321)("digests %j", (input, expected) => {
    expect(md5Hex(input)).toBe(expected);
  });

  it("hashes multibyte UTF-8 text", () => {
    expect(md5Hex("你好 world — naïve café")).toBe("6f5482eab83836f15423aa69b3aab5a6");
  });
});

describe("md5Bytes", () => {
  it("matches md5Hex for the UTF-8 encoding of the same text", () => {
    expect(Array.from(md5Bytes(new TextEncoder().encode("abc"))).map((b) => b.toString(16).padStart(2, "0")).join(""))
      .toBe(md5Hex("abc"));
  });

  it("digests raw non-UTF-8 bytes", () => {
    expect(Array.from(md5Bytes(new Uint8Array([0xff]))).map((b) => b.toString(16).padStart(2, "0")).join("")).toBe(
      "00594fd4f42ba43fc1ca0427a0576295"
    );
  });
});

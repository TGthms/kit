/** RFC 1321 MD5. Web Crypto has no MD5; this stays in-browser. */

function toWords(bytes: Uint8Array): number[] {
  const bitLen = bytes.length * 8;
  const withPad = new Uint8Array(((bytes.length + 8) >> 6 << 6) + 64);
  withPad.set(bytes);
  withPad[bytes.length] = 0x80;
  const view = new DataView(withPad.buffer);
  view.setUint32(withPad.length - 8, bitLen >>> 0, true);
  view.setUint32(withPad.length - 4, Math.floor(bitLen / 0x100000000), true);
  const words: number[] = [];
  for (let i = 0; i < withPad.length; i += 4) words.push(view.getUint32(i, true));
  return words;
}

function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
  const n = (a + q + x + t) | 0;
  return (((n << s) | (n >>> (32 - s))) + b) | 0;
}

export function md5Bytes(bytes: Uint8Array): Uint8Array {
  const words = toWords(bytes);
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;
    const w = words;

    a = cmn((b & c) | (~b & d), a, b, w[i], 7, -680876936);
    d = cmn((a & b) | (~a & c), d, a, w[i + 1], 12, -389564586);
    c = cmn((d & a) | (~d & b), c, d, w[i + 2], 17, 606105819);
    b = cmn((c & d) | (~c & a), b, c, w[i + 3], 22, -1044525330);
    a = cmn((b & c) | (~b & d), a, b, w[i + 4], 7, -176418897);
    d = cmn((a & b) | (~a & c), d, a, w[i + 5], 12, 1200080426);
    c = cmn((d & a) | (~d & b), c, d, w[i + 6], 17, -1473231341);
    b = cmn((c & d) | (~c & a), b, c, w[i + 7], 22, -45705983);
    a = cmn((b & c) | (~b & d), a, b, w[i + 8], 7, 1770035416);
    d = cmn((a & b) | (~a & c), d, a, w[i + 9], 12, -1958414417);
    c = cmn((d & a) | (~d & b), c, d, w[i + 10], 17, -42063);
    b = cmn((c & d) | (~c & a), b, c, w[i + 11], 22, -1990404162);
    a = cmn((b & c) | (~b & d), a, b, w[i + 12], 7, 1804603682);
    d = cmn((a & b) | (~a & c), d, a, w[i + 13], 12, -40341101);
    c = cmn((d & a) | (~d & b), c, d, w[i + 14], 17, -1502002290);
    b = cmn((c & d) | (~c & a), b, c, w[i + 15], 22, 1236535329);

    a = cmn((b & d) | (c & ~d), a, b, w[i + 1], 5, -165796510);
    d = cmn((a & c) | (b & ~c), d, a, w[i + 6], 9, -1069501632);
    c = cmn((d & b) | (a & ~b), c, d, w[i + 11], 14, 643717713);
    b = cmn((c & a) | (d & ~a), b, c, w[i], 20, -373897302);
    a = cmn((b & d) | (c & ~d), a, b, w[i + 5], 5, -701558691);
    d = cmn((a & c) | (b & ~c), d, a, w[i + 10], 9, 38016083);
    c = cmn((d & b) | (a & ~b), c, d, w[i + 15], 14, -660478335);
    b = cmn((c & a) | (d & ~a), b, c, w[i + 4], 20, -405537848);
    a = cmn((b & d) | (c & ~d), a, b, w[i + 9], 5, 568446438);
    d = cmn((a & c) | (b & ~c), d, a, w[i + 14], 9, -1019803690);
    c = cmn((d & b) | (a & ~b), c, d, w[i + 3], 14, -187363961);
    b = cmn((c & a) | (d & ~a), b, c, w[i + 8], 20, 1163531501);
    a = cmn((b & d) | (c & ~d), a, b, w[i + 13], 5, -1444681467);
    d = cmn((a & c) | (b & ~c), d, a, w[i + 2], 9, -51403784);
    c = cmn((d & b) | (a & ~b), c, d, w[i + 7], 14, 1735328473);
    b = cmn((c & a) | (d & ~a), b, c, w[i + 12], 20, -1926607734);

    a = cmn(b ^ c ^ d, a, b, w[i + 5], 4, -378558);
    d = cmn(a ^ b ^ c, d, a, w[i + 8], 11, -2022574463);
    c = cmn(d ^ a ^ b, c, d, w[i + 11], 16, 1839030562);
    b = cmn(c ^ d ^ a, b, c, w[i + 14], 23, -35309556);
    a = cmn(b ^ c ^ d, a, b, w[i + 1], 4, -1530992060);
    d = cmn(a ^ b ^ c, d, a, w[i + 4], 11, 1272893353);
    c = cmn(d ^ a ^ b, c, d, w[i + 7], 16, -155497632);
    b = cmn(c ^ d ^ a, b, c, w[i + 10], 23, -1094730640);
    a = cmn(b ^ c ^ d, a, b, w[i + 13], 4, 681279174);
    d = cmn(a ^ b ^ c, d, a, w[i], 11, -358537222);
    c = cmn(d ^ a ^ b, c, d, w[i + 3], 16, -722521979);
    b = cmn(c ^ d ^ a, b, c, w[i + 6], 23, 76029189);
    a = cmn(b ^ c ^ d, a, b, w[i + 9], 4, -640364487);
    d = cmn(a ^ b ^ c, d, a, w[i + 12], 11, -421815835);
    c = cmn(d ^ a ^ b, c, d, w[i + 15], 16, 530742520);
    b = cmn(c ^ d ^ a, b, c, w[i + 2], 23, -995338651);

    a = cmn(c ^ (b | ~d), a, b, w[i], 6, -198630844);
    d = cmn(b ^ (a | ~c), d, a, w[i + 7], 10, 1126891415);
    c = cmn(a ^ (d | ~b), c, d, w[i + 14], 15, -1416354905);
    b = cmn(d ^ (c | ~a), b, c, w[i + 5], 21, -57434055);
    a = cmn(c ^ (b | ~d), a, b, w[i + 12], 6, 1700485571);
    d = cmn(b ^ (a | ~c), d, a, w[i + 3], 10, -1894986606);
    c = cmn(a ^ (d | ~b), c, d, w[i + 10], 15, -1051523);
    b = cmn(d ^ (c | ~a), b, c, w[i + 1], 21, -2054922799);
    a = cmn(c ^ (b | ~d), a, b, w[i + 8], 6, 1873313359);
    d = cmn(b ^ (a | ~c), d, a, w[i + 15], 10, -30611744);
    c = cmn(a ^ (d | ~b), c, d, w[i + 6], 15, -1560198380);
    b = cmn(d ^ (c | ~a), b, c, w[i + 13], 21, 1309151649);
    a = cmn(c ^ (b | ~d), a, b, w[i + 4], 6, -145523070);
    d = cmn(b ^ (a | ~c), d, a, w[i + 11], 10, -1120210379);
    c = cmn(a ^ (d | ~b), c, d, w[i + 2], 15, 718787259);
    b = cmn(d ^ (c | ~a), b, c, w[i + 9], 21, -343485551);

    a = (a + oa) | 0;
    b = (b + ob) | 0;
    c = (c + oc) | 0;
    d = (d + od) | 0;
  }

  const out = new Uint8Array(16);
  const view = new DataView(out.buffer);
  view.setUint32(0, a, true);
  view.setUint32(4, b, true);
  view.setUint32(8, c, true);
  view.setUint32(12, d, true);
  return out;
}

export function md5Hex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return [...md5Bytes(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

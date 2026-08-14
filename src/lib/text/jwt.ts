export type JwtPart = { raw: string; json: unknown | null; error?: string };

export type JwtDecodeResult =
  | {
      ok: true;
      header: JwtPart;
      payload: JwtPart;
      signature: string;
      signed: boolean;
    }
  | { ok: false; error: string };

function b64urlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodePart(raw: string): JwtPart {
  try {
    const text = new TextDecoder().decode(b64urlToBytes(raw));
    return { raw, json: JSON.parse(text) };
  } catch (e) {
    return { raw, json: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function decodeJwt(token: string): JwtDecodeResult {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: "Token is empty" };
  const parts = trimmed.split(".");
  if (parts.length < 2 || parts.length > 3) {
    return { ok: false, error: "A JWT has two or three dot-separated parts" };
  }
  const [h, p, s = ""] = parts;
  if (!h || !p) return { ok: false, error: "Header or payload is missing" };
  return {
    ok: true,
    header: decodePart(h),
    payload: decodePart(p),
    signature: s,
    signed: s.length > 0,
  };
}

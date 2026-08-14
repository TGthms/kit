const SETS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*_-+=?",
};

export type PasswordOpts = {
  length: number;
  lower?: boolean;
  upper?: boolean;
  digits?: boolean;
  symbols?: boolean;
};

export function generatePassword(opts: PasswordOpts): string {
  const length = Math.max(4, Math.min(128, Math.floor(opts.length) || 16));
  let alphabet = "";
  const required: string[] = [];
  (["lower", "upper", "digits", "symbols"] as const).forEach((k) => {
    if (opts[k] !== false) {
      alphabet += SETS[k];
      required.push(SETS[k][rand(SETS[k].length)]);
    }
  });
  if (!alphabet) throw new Error("Select at least one character set");
  const out = required.slice(0, length);
  while (out.length < length) out.push(alphabet[rand(alphabet.length)]);
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

function rand(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

import { PDFDocument } from "@cantoo/pdf-lib";

export type PdfReadability = "open" | "encrypted" | "unreadable";

export async function inspectPdfReadability(buf: ArrayBuffer | Uint8Array): Promise<PdfReadability> {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  try {
    // ignoreEncryption skips the password prompt; isEncrypted still reports
    // the Encrypt dict. Loading without it throws EncryptedPDFError for locked
    // files, which Vitest treats as an unhandled rejection.
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return doc.isEncrypted ? "encrypted" : "open";
  } catch {
    return "unreadable";
  }
}

export async function isPdfEncrypted(buf: ArrayBuffer | Uint8Array): Promise<boolean> {
  return (await inspectPdfReadability(buf)) === "encrypted";
}

export async function lockPdf(
  buf: ArrayBuffer | Uint8Array,
  userPassword: string,
  ownerPassword?: string
): Promise<Uint8Array> {
  if (!userPassword) throw new Error("Password is required");
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (doc.isEncrypted) {
    throw new Error("PDF is already encrypted. Unlock it first.");
  }
  // AES-256 / ISO 32000-2 rev 6. RC4 is refused unless allowWeakCryptography.
  doc.encrypt({
    userPassword,
    ownerPassword: ownerPassword || userPassword,
    algorithm: "AES-256",
  });
  return doc.save();
}

/** Load with the password and rewrite without an Encrypt dict. */
export async function unlockPdf(
  buf: ArrayBuffer | Uint8Array,
  password: string
): Promise<Uint8Array> {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const locked = await PDFDocument.load(bytes, { password });
  const open = await PDFDocument.create();
  const pages = await open.copyPages(locked, locked.getPageIndices());
  pages.forEach((page) => open.addPage(page));
  return open.save();
}

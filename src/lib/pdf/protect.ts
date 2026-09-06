import { PDFDocument } from "@cantoo/pdf-lib";

export type PdfReadability = "open" | "encrypted" | "unreadable";

/**
 * Loading with the correct password makes the parser decrypt streams and the
 * constructor drop the Encrypt dict, so the returned document can be saved
 * out as a plain PDF with every object — pages, AcroForm, outlines, metadata
 * — intact. The empty user password of owner-restricted files counts as
 * correct: those documents are freely readable and must not dead-end in the
 * tools. Returns null when the password does not decrypt the file.
 */
async function loadDecrypted(
  bytes: Uint8Array,
  password: string,
  updateMetadata = true
): Promise<PDFDocument | null> {
  try {
    return await PDFDocument.load(bytes, { password, updateMetadata });
  } catch {
    return null;
  }
}

export async function inspectPdfReadability(buf: ArrayBuffer | Uint8Array): Promise<PdfReadability> {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  try {
    // ignoreEncryption skips the password prompt; isEncrypted still reports
    // the Encrypt dict. Loading without it throws EncryptedPDFError for locked
    // files, which Vitest treats as an unhandled rejection.
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    if (!doc.isEncrypted) return "open";
    // Owner-restricted files (empty user password) are readable as-is.
    return (await loadDecrypted(bytes, "")) ? "open" : "encrypted";
  } catch {
    // Some encrypted files fail to parse without decryption; try the empty
    // user password before giving up on the bytes entirely.
    return (await loadDecrypted(bytes, "")) ? "open" : "unreadable";
  }
}

export async function isPdfEncrypted(buf: ArrayBuffer | Uint8Array): Promise<boolean> {
  return (await inspectPdfReadability(buf)) === "encrypted";
}

/**
 * Parse a PDF for structural work: returns the document when it is readable —
 * including owner-restricted files, returned fully decrypted — and throws the
 * user-facing errors the tools surface otherwise. `ignoreEncryption` alone
 * never decrypts content streams, so encrypted input is only accepted when
 * the empty user password unlocks it. Structure tools reuse the returned
 * document so each file is parsed once.
 */
export async function loadReadablePdf(
  buf: ArrayBuffer | Uint8Array,
  opts: { updateMetadata?: boolean } = {}
): Promise<PDFDocument> {
  const updateMetadata = opts.updateMetadata ?? true;
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let parsed: PDFDocument | null = null;
  try {
    parsed = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata });
    if (!parsed.isEncrypted) return parsed;
  } catch {
    parsed = null;
  }
  const decrypted = await loadDecrypted(bytes, "", updateMetadata);
  if (decrypted) return decrypted;
  if (parsed) {
    throw new Error("This PDF is password-protected. Unlock it first, then try again.");
  }
  throw new Error("This file could not be read as a PDF.");
}

export async function lockPdf(
  buf: ArrayBuffer | Uint8Array,
  userPassword: string,
  ownerPassword?: string
): Promise<Uint8Array> {
  if (!userPassword) throw new Error("Password is required");
  // Owner-restricted input is accepted: loadReadablePdf hands back a
  // decrypted document that can be re-encrypted with the new password.
  const doc = await loadReadablePdf(buf);
  // AES-256 / ISO 32000-2 rev 6. RC4 is refused unless allowWeakCryptography.
  doc.encrypt({
    userPassword,
    ownerPassword: ownerPassword || userPassword,
    algorithm: "AES-256",
  });
  return doc.save();
}

/**
 * Load with the password and rewrite without an Encrypt dict.
 *
 * The decrypted document cannot simply be re-saved: @cantoo/pdf-lib re-embeds
 * the stale /Encrypt reference in the new trailer and its parser does not
 * recover Info-dict strings, so a full-fidelity save is impossible here.
 * Re-saving a page-level copy into a fresh document is the one path that
 * verifiably produces clean plain output — at the cost of form fields,
 * bookmarks, and metadata, which the Unlock UI discloses.
 */
export async function unlockPdf(
  buf: ArrayBuffer | Uint8Array,
  password: string
): Promise<Uint8Array> {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const locked = await loadDecrypted(bytes, password);
  if (!locked) throw new Error("Wrong password, or the PDF could not be decrypted.");
  const open = await PDFDocument.create();
  const pages = await open.copyPages(locked, locked.getPageIndices());
  pages.forEach((page) => open.addPage(page));
  return open.save();
}

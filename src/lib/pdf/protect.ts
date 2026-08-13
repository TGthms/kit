import { PDFDocument } from "@cantoo/pdf-lib";
import { PDFDocument as PdfLibDocument } from "pdf-lib";

export async function isPdfEncrypted(buf: ArrayBuffer | Uint8Array): Promise<boolean> {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  try {
    await PdfLibDocument.load(bytes);
    return false;
  } catch {
    return true;
  }
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
  doc.encrypt({
    userPassword,
    ownerPassword: ownerPassword || userPassword,
  });
  return doc.save();
}

/** Load with the password and rewrite without an Encrypt dict. */
export async function unlockPdf(
  buf: ArrayBuffer | Uint8Array,
  password: string
): Promise<Uint8Array> {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const doc = await PDFDocument.load(bytes, { password });
  return doc.save();
}

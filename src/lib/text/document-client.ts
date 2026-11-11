import { withBasePath } from "@/lib/base-path";
import { APP_VERSION } from "@/lib/version";
/** One isolated worker per document conversion. Cancel and the deadline actually
 * terminate parsing instead of merely hiding its progress indicator. */
export function convertDocument(input: string, from: string, to: string, spreadsheetSafe: boolean, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Canceled", "AbortError")); return; }
    let worker: Worker;
    try { worker = new Worker(`${withBasePath("/vendor/documents/worker.js")}?v=${APP_VERSION}`); }
    catch { reject(new Error("This browser cannot start document processing.")); return; }
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener("abort", cancel); worker.terminate(); };
    const cancel = () => { cleanup(); reject(new DOMException("Canceled", "AbortError")); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("This document took too long to convert. Try a smaller section.")); }, 8000);
    signal.addEventListener("abort", cancel, { once: true });
    worker.onmessage = ({ data }) => { cleanup(); if (data.ok && typeof data.text === "string") resolve(data.text); else reject(new Error(data.error || "Document conversion failed.")); };
    worker.onerror = () => { cleanup(); reject(new Error("Document processing is unavailable.")); };
    try { worker.postMessage({ input, from, to, spreadsheetSafe }); }
    catch (error) { cleanup(); reject(error); }
  });
}

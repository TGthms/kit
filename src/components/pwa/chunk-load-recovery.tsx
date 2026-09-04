"use client";

import { useEffect } from "react";
import { isChunkLoadError, reloadForStaleChunk } from "@/lib/pwa/chunk-load";

/** After a deploy, in-memory webpack still names deleted hashed chunks. Reload once. */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) reloadForStaleChunk();
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) reloadForStaleChunk();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

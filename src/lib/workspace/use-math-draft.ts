"use client";
import { useEffect, useRef, useState } from "react";
import {
  DRAFT_EVENT,
  draftKey,
  parseMathDraft,
  recoveryEnabled,
  type MathDraftKey,
} from "./math";

/** Only allowlisted math state is persisted. Flush on page hide/unmount as well
 * as after edits; storage denial never interrupts the editor. */
export function useMathDraft<T>(
  key: MathDraftKey,
  value: T,
  restore: (value: T) => void,
) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = useRef(value);
  const restoreRef = useRef(restore);
  useEffect(() => {
    current.current = value;
    restoreRef.current = restore;
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(key));
      const held =
        raw && raw.length <= 40000
          ? parseMathDraft(key, JSON.parse(raw))
          : null;
      if (recoveryEnabled() && held) {
        current.current = held as T;
        restoreRef.current(held as T);
      }
    } catch {
      /* Malformed/denied storage must not prevent editing. */
    }
    // Loading an external draft is deliberately synchronized after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    const flush = () => {
      try {
        if (recoveryEnabled()) {
          const clean = parseMathDraft(key, current.current);
          if (clean) localStorage.setItem(draftKey(key), JSON.stringify(clean));
        }
      } catch {
        setFailed(true);
      }
    };
    const hide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener(DRAFT_EVENT, flush);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener(DRAFT_EVENT, flush);
    };
  }, [key]);
  const serialized = JSON.stringify(value);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        if (recoveryEnabled() && parseMathDraft(key, JSON.parse(serialized)))
          localStorage.setItem(draftKey(key), serialized);
      } catch {
        setFailed(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [key, ready, serialized]);
  return { ready, failed };
}

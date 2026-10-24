"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { isStandaloneDisplay } from "@/lib/pwa/viewport";

type InstallEvent = Event & { prompt(): Promise<{ outcome: "accepted" | "dismissed" }> };
type InstallState = {
  ready: boolean;
  installed: boolean;
  canPrompt: boolean;
  pending: boolean;
  failed: boolean;
  guidance: "ios" | "mac" | "browser";
  install(): Promise<void>;
};
const InstallContext = createContext<InstallState | null>(null);

/** Capture the browser's one-use prompt across client navigation. Promotion
 * stays in Settings; never pop an install modal while someone uses a tool. */
export function InstallProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<InstallState, "install">>({ ready: false, installed: false, canPrompt: false, pending: false, failed: false, guidance: "browser" });
  const prompt = useRef<InstallEvent | null>(null);
  const pending = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const queries = ["standalone", "fullscreen", "minimal-ui"].map((mode) => window.matchMedia(`(display-mode: ${mode})`));
    const installed = () => isStandaloneDisplay(navigator as Navigator & { standalone?: boolean }, (query) => queries.some((media) => media.media === query && media.matches));
    const ios = /iP(?:hone|ad|od)/u.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const macSafari = /Mac/u.test(navigator.platform) && /Safari/u.test(navigator.userAgent) && !/Chrome|Chromium|Edg|OPR/u.test(navigator.userAgent);
    const sync = () => {
      const runningInstalled = installed();
      if (runningInstalled) prompt.current = null;
      setState((previous) => ({ ...previous, ready: true, installed: runningInstalled, canPrompt: !runningInstalled && prompt.current !== null, guidance: ios ? "ios" : macSafari ? "mac" : "browser" }));
    };
    const onPrompt = (event: Event) => {
      if (typeof (event as InstallEvent).prompt !== "function") return;
      event.preventDefault();
      if (installed()) return;
      prompt.current = event as InstallEvent;
      setState((previous) => ({ ...previous, canPrompt: true, failed: false }));
    };
    const onInstalled = () => {
      prompt.current = null;
      setState((previous) => ({ ...previous, installed: true, canPrompt: false, failed: false }));
    };
    sync();
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    for (const media of queries) media.addEventListener("change", sync);
    return () => {
      mounted.current = false;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      for (const media of queries) media.removeEventListener("change", sync);
    };
  }, []);

  const install = async () => {
    const event = prompt.current;
    if (!event || pending.current) return;
    prompt.current = null;
    pending.current = true;
    setState((previous) => ({ ...previous, canPrompt: false, pending: true, failed: false }));
    try {
      // Call synchronously in the button's activation, before any await.
      await event.prompt();
      // Acceptance is not proof of installation; wait for appinstalled or
      // installed display mode rather than promising a false success.
    } catch {
      if (mounted.current) setState((previous) => ({ ...previous, failed: true }));
    } finally {
      pending.current = false;
      if (mounted.current) setState((previous) => ({ ...previous, pending: false, canPrompt: prompt.current !== null }));
    }
  };
  return <InstallContext value={{ ...state, install }}>{children}</InstallContext>;
}

export function useInstall() {
  const context = useContext(InstallContext);
  if (!context) throw new Error("useInstall requires InstallProvider");
  return context;
}

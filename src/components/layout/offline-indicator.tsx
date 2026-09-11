"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

export function OfflineIndicator() {
  const t = useTranslations("common");
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground"
      role="img"
      aria-label={t("offlineIndicator")}
      title={t("offlineIndicator")}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 14.5c0 1.6.9 3.1 2.2 3.9l-.9.9c-.4.4-.4 1 0 1.4.2.2.4.3.7.3s.5-.1.7-.3l14-14c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-1.8 1.8C14.9 7 14.3 7 13.8 7c-.1-.2-.3-.3-.4-.4C12.4 5.6 11 5 9.5 5S6.6 5.6 5.6 6.6C4.6 7.6 4 9 4 10.5c0 .1 0 .2 0 .3-.2.2-.5.5-.7.6C2.5 12.2 2 13.3 2 14.5Zm2.7-1.8c.2-.2.5-.4.7-.5.4-.2.7-.6.6-1.1C6 10.9 6 10.7 6 10.5 6 9.6 6.4 8.7 7 8c1.3-1.3 3.6-1.3 4.9 0 .2.2.4.4.5.7.2.3.6.5 1 .4l-7.7 7.7c-1-.3-1.7-1.3-1.7-2.4 0-.6.3-1.2.7-1.7Z"
          fill="currentColor"
        />
        <path
          d="M19.6 10.6c-.2-.4-.4-.8-.6-1.2-.3-.5-.9-.6-1.4-.3-.5.3-.6.9-.3 1.4.2.3.4.7.5 1 .1.3.3.5.6.7.9.4 1.5 1.3 1.5 2.3 0 .7-.3 1.3-.7 1.8-.5.5-1.1.7-1.8.7H10c-.6 0-1 .4-1 1s.4 1 1 1h7.5c1.2 0 2.3-.5 3.2-1.3.9-.8 1.3-2 1.3-3.2 0-1.9-.9-3.4-2.4-4.1Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => undefined;

/** True only after client hydration. Server snapshot is always false. */
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

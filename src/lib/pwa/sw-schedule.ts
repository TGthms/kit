export const UPDATE_EVERY_MS = 5 * 60 * 1000;
export const UPDATE_AFTER_VISIBLE_MS = 4000;
export const FILL_AFTER_IDLE_MS = 2500;
export const FILL_RESUME_MS = 2000;

export type EffectiveConnection = { saveData?: boolean; effectiveType?: string };

/**
 * Data-saver and 2G clients skip the background locale precache; the shell
 * they already have keeps working offline either way.
 */
export function shouldSkipHeavyFill(connection?: EffectiveConnection): boolean {
  return Boolean(
    connection?.saveData ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g"
  );
}

/** Update checks are visibility-triggered and must not run more often than UPDATE_EVERY_MS. */
export function shouldCheckForUpdate(now: number, lastUpdateAt: number): boolean {
  return now - lastUpdateAt >= UPDATE_EVERY_MS;
}

/**
 * The version shown in Settings, so a visitor can tell which release they are
 * looking at.
 *
 * `package.json` remains the record; `version.test.ts` fails if the two
 * disagree, so the number can only change in one place and cannot drift.
 */
export const APP_VERSION = "1.2.2";

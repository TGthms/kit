import { execFileSync } from "node:child_process";

/**
 * The date of the commit this build was made from.
 *
 * This exists so the sitemap can state when the content actually changed. A
 * build clock would stamp every address on every deploy, including the many
 * deploys that alter nothing a visitor can see, and a search engine that finds
 * the whole site reported as changed each time stops treating the value as
 * meaningful. Reading the commit instead means rebuilding unchanged content
 * repeats the same date.
 *
 * Returns null when the date cannot be established, so the field can be left
 * out rather than filled with a guess.
 */
export function buildDate(): Date | null {
  const candidates: string[] = [];
  if (process.env.BUILD_DATE) candidates.push(process.env.BUILD_DATE);
  try {
    const fromGit = execFileSync("git", ["log", "-1", "--format=%cI"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (fromGit) candidates.push(fromGit);
  } catch {
    /* no repository, or no git: fall through to the environment value */
  }
  for (const candidate of candidates) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

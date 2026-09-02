function pad2(value: number): string {
  return String(Math.max(0, Math.trunc(value))).padStart(2, "0");
}

/** Padded `HH:MM:SS` (or `MM:SS`) so Scritto can keep colons still across ticks. */
export function clockFace(hours: number | undefined, minutes: number, seconds: number): string {
  const mm = pad2(minutes);
  const ss = pad2(seconds);
  return hours === undefined ? `${mm}:${ss}` : `${pad2(hours)}:${mm}:${ss}`;
}

/**
 * Decorative, aria-hidden illustration; the accessible explanation is the
 * two lists rendered beside it.
 */
export function LaneDiagram() {
  return (
    <div aria-hidden className="flex justify-center py-1 text-muted-foreground">
      <svg
        viewBox="0 0 360 128"
        className="h-auto w-full max-w-sm rtl:-scale-x-100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        {/* device */}
        <rect x="8" y="28" width="112" height="72" rx="16" className="stroke-foreground/25" />
        <rect x="40" y="45" width="22" height="36" rx="3" className="stroke-foreground/50" />
        <path d="M46 53h10M46 59h10M46 65h7" strokeWidth="1.5" className="stroke-foreground/40" />
        <rect x="68" y="45" width="22" height="36" rx="3" className="stroke-foreground/50" />
        <path d="M74 53h10M74 59h10M74 65h7" strokeWidth="1.5" className="stroke-foreground/40" />
        {/* host */}
        <rect x="240" y="28" width="112" height="72" rx="16" className="stroke-foreground/25" />
        <circle cx="296" cy="64" r="15" className="stroke-foreground/50" />
        <path d="M281 64h30M296 49c5.5 4 5.5 26 0 30M296 49c-5.5 4-5.5 26 0 30" strokeWidth="1.5" className="stroke-foreground/40" />
        {/* app files move host to device once; the glyph rides in a gap in the line */}
        <path d="M240 52H192" className="stroke-foreground/60" />
        <path d="M168 52H126" className="stroke-foreground/60" />
        <path d="M134 46l-8 6 8 6" className="stroke-foreground/60" />
        <rect x="173" y="44" width="14" height="16" rx="3" strokeWidth="1.5" className="stroke-foreground/60" />
        {/* rates move device to host as pair codes only; coin in a gap */}
        <path d="M120 76H168" strokeDasharray="6 6" className="stroke-foreground/50" />
        <path d="M192 76H234" strokeDasharray="6 6" className="stroke-foreground/50" />
        <path d="M226 70l8 6-8 6" className="stroke-foreground/50" />
        <circle cx="180" cy="76" r="8" strokeWidth="1.5" className="stroke-foreground/50" />
        <circle cx="180" cy="76" r="3" strokeWidth="1.5" className="stroke-foreground/50" />
      </svg>
    </div>
  );
}

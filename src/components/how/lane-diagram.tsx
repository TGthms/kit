/**
 * Decorative illustration for the "what stays here, what goes out" section.
 * Left: the device holding your files. Right: Kit's static host. The solid
 * arrow is the app coming down once; the dashed arrow is the only request a
 * tool can send (currency pair codes). Purely iconographic — the accessible
 * explanation is the two lists rendered next to it. Mirrored in RTL.
 */
export function LaneDiagram() {
  return (
    <div aria-hidden className="flex justify-center py-1 text-muted-foreground">
      <svg
        viewBox="0 0 340 128"
        className="h-auto w-full max-w-sm rtl:-scale-x-100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        {/* device */}
        <rect x="12" y="34" width="104" height="76" rx="14" className="stroke-foreground/25" />
        <rect x="34" y="55" width="26" height="34" rx="3" className="stroke-foreground/50" />
        <path d="M40 63h14M40 69h14M40 75h10" strokeWidth="1.5" className="stroke-foreground/40" />
        <rect x="66" y="55" width="26" height="34" rx="3" className="stroke-foreground/50" />
        <path d="M72 63h14M72 69h14M72 75h10" strokeWidth="1.5" className="stroke-foreground/40" />
        {/* host */}
        <rect x="224" y="34" width="104" height="76" rx="14" className="stroke-foreground/25" />
        <circle cx="276" cy="72" r="14" className="stroke-foreground/50" />
        <path d="M262 72h28M276 58c5 4 5 24 0 28M276 58c-5 4-5 24 0 28" strokeWidth="1.5" className="stroke-foreground/40" />
        {/* app files: host to device, once */}
        <path d="M224 52H148" className="stroke-foreground/60" />
        <path d="M156 46l-8 6 8 6" className="stroke-foreground/60" />
        <rect x="180" y="44" width="12" height="16" rx="2" strokeWidth="1.5" className="stroke-foreground/40" />
        {/* rates: device to host, only pair codes */}
        <path d="M116 92h72" strokeDasharray="5 5" className="stroke-foreground/50" />
        <path d="M180 86l8 6-8 6" className="stroke-foreground/50" />
        <circle cx="154" cy="92" r="7" strokeWidth="1.5" className="stroke-foreground/50" />
        <path d="M154 88.5v7M151.5 90.5h5" strokeWidth="1.5" className="stroke-foreground/50" />
      </svg>
    </div>
  );
}

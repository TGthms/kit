import { cn } from "@/lib/utils";

/** Centered page-body wait. Chrome (header / tab bar) stays mounted around it. */
export function PageLoader({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[min(28rem,calc(100dvh-8.5rem))] flex-col items-center justify-center",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="kit-spinner" aria-hidden />
    </div>
  );
}

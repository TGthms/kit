import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Btn2Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  children?: ReactNode;
  icon?: ReactNode;
};

/**
 * Outline pill matching the outline Button at rest, with a CSS-only hover
 * flourish so usage adds no motion runtime dependency.
 */
export function Btn2({ icon, children, className, ...props }: Btn2Props) {
  return (
    <a
      {...props}
      className={cn(
        "group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full px-4",
        "border border-border bg-background text-sm font-medium text-foreground",
        "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none",
        "hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {icon ? (
        <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <span className="absolute inset-0 rounded-full bg-primary/15 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          <span className="relative [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          <span className="pointer-events-none absolute -right-1 -top-1 opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:hidden">
            <span className="block h-1.5 w-1.5 rotate-45 bg-primary" />
          </span>
          <span className="pointer-events-none absolute -left-1 top-0.5 opacity-0 transition-all delay-75 duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-80 motion-reduce:hidden">
            <span className="block h-1 w-1 rotate-45 bg-accent-foreground" />
          </span>
        </span>
      ) : null}
      <span className="relative whitespace-nowrap">{children}</span>
    </a>
  );
}

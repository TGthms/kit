"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Btn2Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  children?: ReactNode;
  theme?: "light" | "dark";
};

/**
 * Kit adaptation of Amicro button 2: a small GitHub-style sparkle action.
 * It keeps the interaction CSS-only so the footer does not add a motion
 * runtime dependency, while inheriting Kit's light/dark design tokens.
 */
export function Btn2({ children, className, theme, ...props }: Btn2Props) {
  return (
    <a
      {...props}
      className={cn(
        "kit-btn-2 group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full px-4",
        "border border-border/70 bg-card text-sm font-medium text-foreground",
        "shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-secondary hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        theme === "dark" && "dark",
        className
      )}
    >
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary/15 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <Star className="relative h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" aria-hidden />
        <span className="pointer-events-none absolute -right-1 -top-1 opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100">
          <span className="block h-1.5 w-1.5 rotate-45 bg-primary" />
        </span>
        <span className="pointer-events-none absolute -left-1 top-0.5 opacity-0 transition-all delay-75 duration-300 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-80">
          <span className="block h-1 w-1 rotate-45 bg-accent-foreground" />
        </span>
      </span>
      <span className="relative whitespace-nowrap">{children}</span>
    </a>
  );
}

"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Explicit light/dark choices from the UI override system thereafter.
      disableTransitionOnChange
    >
      {children}
      <Toaster richColors position="top-center" closeButton />
    </ThemeProvider>
  );
}

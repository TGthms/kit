import { DocumentHead } from "@/components/layout/document-head";

/** `/` LocaleGate lives outside `[locale]` and still needs a document shell. */
export default function RootGateLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <DocumentHead />
      </head>
      <body>{children}</body>
    </html>
  );
}

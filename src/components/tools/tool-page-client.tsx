"use client";

import dynamic from "next/dynamic";
import type { ToolId } from "@/lib/tools/registry";

const ToolView = dynamic(
  () => import("@/components/tools/tool-views").then((m) => m.ToolView),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
        …
      </div>
    ),
  }
);

export function ToolPageClient({ toolId }: { toolId: ToolId }) {
  return <ToolView toolId={toolId} />;
}

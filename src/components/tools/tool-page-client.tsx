"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { ToolId } from "@/lib/tools/registry";

const ToolView = dynamic(
  () => import("@/components/tools/tool-views").then((m) => m.ToolView),
  { ssr: true }
);

export function ToolPageClient({ toolId }: { toolId: ToolId }) {
  return (
    <Suspense fallback={null}>
      <ToolView toolId={toolId} />
    </Suspense>
  );
}

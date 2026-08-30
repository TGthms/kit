"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import type { ToolId } from "@/lib/tools/registry";
import { rewriteLegacyToolPath } from "@/lib/navigation/routes";

const ToolView = dynamic(
  () => import("@/components/tools/tool-views").then((m) => m.ToolView),
  { ssr: true }
);

export function ToolPageClient({ toolId }: { toolId: ToolId }) {
  useEffect(() => {
    rewriteLegacyToolPath(toolId);
  }, [toolId]);

  return (
    <Suspense fallback={null}>
      <ToolView toolId={toolId} />
    </Suspense>
  );
}

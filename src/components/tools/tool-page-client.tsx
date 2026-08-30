"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import type { ToolId } from "@/lib/tools/registry";
import { rewriteLegacyToolPath } from "@/lib/navigation/routes";
import { PageLoader } from "@/components/shared/page-loader";

const ToolView = dynamic(
  () => import("@/components/tools/tool-views").then((m) => m.ToolView),
  { ssr: true, loading: () => <PageLoader /> }
);

export function ToolPageClient({ toolId }: { toolId: ToolId }) {
  useEffect(() => {
    rewriteLegacyToolPath(toolId);
  }, [toolId]);

  return (
    <Suspense fallback={<PageLoader />}>
      <ToolView toolId={toolId} />
    </Suspense>
  );
}

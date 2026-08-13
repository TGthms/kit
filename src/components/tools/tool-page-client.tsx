"use client";

import dynamic from "next/dynamic";
import type { ToolId } from "@/lib/tools/registry";

const ToolView = dynamic(
  () => import("@/components/tools/tool-views").then((m) => m.ToolView),
  { ssr: true }
);

export function ToolPageClient({ toolId }: { toolId: ToolId }) {
  return <ToolView toolId={toolId} />;
}

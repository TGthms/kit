import type { ToolId } from "@/lib/tools/registry";
import { toolPathSegment } from "@/lib/navigation/routes";
import { absoluteUrl } from "./site";

function pathLocale(pathLoc: string): string {
  return pathLoc === "zh" ? "zh-Hans" : pathLoc;
}

/** Public tool URL with no nav query (`from=`). Always on the canonical host. */
export function toolShareUrl(pathLoc: string, toolId: ToolId): string {
  return absoluteUrl(`/${pathLocale(pathLoc)}/tools/${toolPathSegment(toolId)}/`);
}

/** Drop Kit navigation params so a copied/shared URL is the public page. */
export function stripShareQuery(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete("from");
  parsed.hash = "";
  const search = parsed.searchParams.toString();
  parsed.search = search ? `?${search}` : "";
  return parsed.toString();
}

import { tools, type ToolId } from "@/lib/tools/registry";
import { toolPathSegment } from "@/lib/navigation/routes";
import type { OfflinePlan, OfflineState } from "./offline-status";

/** Availability describes this language and its dependencies, rather than a
 * page found somewhere in another language's cache. Currency is conditional:
 * its live data cannot be promised by downloading the app. */
export function offlineReadiness(state: OfflineState | null, locale: string, storedPlan: OfflinePlan | null) {
  const enginesReady = Boolean(state && state.engines.total > 0 && state.engines.done === state.engines.total);
  const toolPages = new Set(state?.toolPages?.[locale] || []);
  const requiresEngines = (id: ToolId) => {
    const tool = tools.find((entry) => entry.id === id);
    return tool && ["pdf", "audio", "video"].includes(tool.category);
  };
  const usable = new Set(tools.filter((tool) => tool.id !== "currency-converter" && toolPages.has(toolPathSegment(tool.id)) && (!requiresEngines(tool.id) || enginesReady)).map((tool) => tool.id));
  const plan = state?.plan ?? storedPlan;
  const appReady = Boolean(state?.essentials?.[locale]?.ready);
  const missingRequiredEngines = Boolean(plan?.tools.some((id) => requiresEngines(id)) && !enginesReady);
  const missingEssentials = Boolean(plan?.locales.some((id) => state?.essentials?.[id]?.ready === false));
  const missingSelection = Boolean(plan && state?.toolPages && state.pages && plan.locales.some((id) =>
    plan.tools.some((tool) => !(state.toolPages?.[id] || []).includes(toolPathSegment(tool))) || plan.pages.some((page) => !(state.pages?.[id] || []).includes(page))));
  const repair = Boolean(plan && (state?.plan?.ready === false || missingRequiredEngines || missingEssentials || missingSelection));
  const verified = Boolean(state?.verifiedAt);
  return {
    ready: verified && appReady && !repair,
    repair,
    appReady,
    verified,
    usable,
    enginesReady,
    pages: state?.pages?.[locale] || [],
    languages: Object.entries(state?.essentials || {}).filter(([, value]) => value.ready).map(([id]) => id),
    conditionalCurrency: toolPages.has("currency-converter"),
    needsEngines: missingRequiredEngines,
  };
}

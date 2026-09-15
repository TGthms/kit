import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { toolPathSegment } from "@/lib/navigation/routes";
import { relatedTools } from "@/lib/tools/related";
import { getTool, type ToolId } from "@/lib/tools/registry";

/**
 * The questions answered on every tool page, drawn from the same wording the
 * How page uses: where a file goes, whether anything is uploaded, and whether
 * the tool keeps working without a connection. They are the ones a visitor
 * arrives with, and they already exist in every language, so nothing here is a
 * fresh claim about the product translated thirty times.
 */
const TOOL_FAQ = [
  ["faqFilesQ", "faqFilesA"],
  ["faqBrowserQ", "faqBrowserA"],
  ["faqOfflineQ", "faqOfflineA"],
] as const;

/**
 * What a tool page says besides being a tool: where to go next, and the
 * questions that decide whether someone trusts it with the job.
 *
 * Rendered by the server, so it is part of the document a crawler is served —
 * the interactive tool beside it is not, because it needs a browser to do
 * anything at all. Links carry no query: a related tool is a plain address, and
 * its own back control falls to the category.
 */
export async function ToolGuide({ toolId }: { toolId: ToolId }) {
  const tool = getTool(toolId);
  if (!tool) return null;
  const [tTools, tHow, tPage] = await Promise.all([
    getTranslations("tools"),
    getTranslations("how"),
    getTranslations("toolPage"),
  ]);
  const related = relatedTools(toolId);

  return (
    <div className="mt-10 space-y-10">
      {related.length ? (
        <section aria-labelledby="kit-related">
          <h2 id="kit-related" className="type-title text-lg font-semibold tracking-[-0.015em]">
            {tPage("related")}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((id) => (
              <li key={id}>
                <Link
                  href={`/tools/${toolPathSegment(id)}/`}
                  data-pressable
                  className="pressable-soft inline-flex min-h-11 items-center rounded-full border border-border/50 bg-secondary/40 px-4 text-sm"
                >
                  {tTools(`${id}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="kit-tool-faq">
        <h2 id="kit-tool-faq" className="type-title text-lg font-semibold tracking-[-0.015em]">
          {tHow("faqTitle")}
        </h2>
        <dl className="mt-3 space-y-5">
          {TOOL_FAQ.map(([question, answer]) => (
            <div key={question}>
              <dt className="type-body font-medium">{tHow(question)}</dt>
              <dd className="type-body mt-1 text-muted-foreground">{tHow(answer)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

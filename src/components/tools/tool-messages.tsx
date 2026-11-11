import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { messagesForTool } from "@/lib/i18n/slim";
export async function ToolMessages({ toolId, children }: { toolId: string; children: React.ReactNode }) {
  return <NextIntlClientProvider messages={messagesForTool(await getMessages(), toolId)}>{children}</NextIntlClientProvider>;
}

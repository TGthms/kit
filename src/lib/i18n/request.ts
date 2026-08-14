import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isPathLocale, messageFileFor } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !isPathLocale(locale)) {
    locale = defaultLocale;
  }
  const file = messageFileFor(locale);
  return {
    locale,
    messages: (await import(`../../../messages/${file}.json`)).default,
  };
});

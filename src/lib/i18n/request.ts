import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !isLocale(locale)) {
    locale = defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../../messages/${locale}.json`)).default,
  };
});

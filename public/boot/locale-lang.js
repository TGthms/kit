(function () {
  try {
    var script = document.currentScript;
    var base = (script && script.getAttribute("data-base-path")) || "";
    var known = ((script && script.getAttribute("data-locales")) || "").split(",").filter(Boolean);
    var path = location.pathname;
    if (base && path.indexOf(base) === 0) path = path.slice(base.length);
    var locale = path.split("/").filter(Boolean)[0] || "";
    if (locale === "zh") locale = "zh-Hans";
    if (known.indexOf(locale) < 0) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" || locale === "he" ? "rtl" : "ltr";
  } catch {
    /* ignore */
  }
})();

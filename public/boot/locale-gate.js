(function () {
  try {
    var script = document.currentScript;
    var base = (script && script.getAttribute("data-base-path")) || "";
    var known = ((script && script.getAttribute("data-locales")) || "").split(",").filter(Boolean);
    var path = location.pathname;
    if (base && path.indexOf(base) === 0) path = path.slice(base.length);
    if (path !== "/" && path !== "") return;
    var stored = null;
    try {
      stored = localStorage.getItem("kit-locale");
    } catch {
      stored = null;
    }
    var locale = stored || "";
    if (locale === "zh") locale = "zh-Hans";
    if (known.indexOf(locale) < 0) {
      var nav = (navigator.language || "").toLowerCase().replace(/_/g, "-");
      if (known.indexOf(nav) >= 0) locale = nav;
      else if (nav === "zh" || nav.indexOf("zh-") === 0) locale = /hant|-tw|-hk|-mo/.test(nav) ? "zh-Hant" : "zh-Hans";
      else if (nav === "pt" || nav.indexOf("pt-") === 0) locale = nav.indexOf("br") >= 0 ? "pt-BR" : "pt-PT";
      else if (nav === "no" || nav.indexOf("no-") === 0 || nav.indexOf("nb") === 0 || nav.indexOf("nn") === 0) locale = "nb";
      else {
        var prefix = nav.split("-")[0] || "";
        locale = known.indexOf(prefix) >= 0 ? prefix : "en";
      }
    }
    // Keep query/hash so /?date=2026-12-25 survives the locale hop. Same as withSearchAndHash.
    location.replace((base || "") + "/" + locale + "/" + (location.search || "") + (location.hash || ""));
  } catch {
    /* ignore */
  }
})();

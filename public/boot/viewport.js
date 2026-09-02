/** Keep in sync with src/lib/pwa/viewport.ts */
(function () {
  try {
    var standalone =
      (window.navigator && window.navigator.standalone === true) ||
      (window.matchMedia &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: fullscreen)").matches ||
          window.matchMedia("(display-mode: minimal-ui)").matches));
    if (!standalone) return;

    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }
    var parts = String(meta.getAttribute("content") || "")
      .split(",")
      .map(function (part) {
        return part.trim();
      })
      .filter(function (part) {
        return part && !/^maximum-scale\s*=/i.test(part) && !/^user-scalable\s*=/i.test(part);
      });
    parts.push("maximum-scale=1", "user-scalable=no");
    meta.setAttribute("content", parts.join(", "));
  } catch {
    /* matchMedia / DOM may be unavailable */
  }
})();

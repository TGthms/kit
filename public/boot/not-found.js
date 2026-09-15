/*
 * The language of the address that was asked for.
 *
 * The export has one document to answer every missing address with, so it is
 * written in the default language and corrected here from the address's first
 * segment — the same segment `locale-lang.js` reads to set the document's lang
 * and direction. Only the words change: the mark, the layout and the way back
 * are the same in every language, and the default is already right when the
 * address names no language or one this build does not have.
 *
 * Runs as the parser reaches the end of the body, which is before the first
 * paint, so the page is never seen in one language and then the other.
 */
(function () {
  try {
    var script = document.currentScript;
    var data = document.getElementById("kit-not-found-copy");
    if (!script || !data) return;

    var copy = JSON.parse(data.textContent || "{}");
    var base = script.getAttribute("data-base-path") || "";
    var site = script.getAttribute("data-site-name") || "";

    var path = location.pathname;
    if (base && path.indexOf(base) === 0) path = path.slice(base.length);
    var segment = path.split("/").filter(Boolean)[0] || "";
    if (!copy[segment]) segment = "en";
    var text = copy[segment];
    if (!text) return;

    var put = function (element, value) {
      if (element && value) element.textContent = value;
    };
    put(document.getElementById("kit-not-found-title"), text.title);
    put(document.getElementById("kit-not-found-body"), text.body);

    /* The one link leaves for the language the address named, not the one this
       document was written in. */
    var home = document.getElementById("kit-not-found-home");
    if (home) {
      put(home, text.home);
      home.setAttribute("href", base + "/" + segment + "/");
    }

    document.title = site ? text.title + " \u2014 " + site : text.title;
  } catch {
    /* The default language is on the page already. */
  }
})();

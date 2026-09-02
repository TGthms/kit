/** Keep in sync with src/lib/theme/resolve.ts */
(function () {
  try {
    var NIGHT_START = 22;
    var NIGHT_END = 5;
    var THEME_KEY = "theme";
    var CONTEXT_KEY = "kit-theme-context";
    var root = document.documentElement;
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var system = systemDark ? "dark" : "light";
    var hour = new Date().getHours();
    var night = hour >= NIGHT_START || hour < NIGHT_END;
    var force = systemDark || night;

    var stored = localStorage.getItem(THEME_KEY) || "system";
    if (stored !== "system" && stored !== "light" && stored !== "dark") stored = "system";

    var choice = stored;
    try {
      var ctx = JSON.parse(localStorage.getItem(CONTEXT_KEY) || "null");
      if (ctx && (ctx.choice === "system" || ctx.choice === "light" || ctx.choice === "dark")) {
        choice = ctx.choice;
      } else {
        localStorage.setItem(CONTEXT_KEY, JSON.stringify({ choice: stored, system: system }));
      }
    } catch {
      try {
        localStorage.setItem(CONTEXT_KEY, JSON.stringify({ choice: stored, system: system }));
      } catch {
        /* private mode */
      }
    }

    var applied = force ? (choice === "system" && systemDark ? "system" : "dark") : choice;
    if (applied !== stored) {
      try {
        localStorage.setItem(THEME_KEY, applied);
      } catch {
        /* private mode */
      }
    }

    var theme = applied === "system" ? (systemDark ? "dark" : "light") : applied;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#f5f5f7");
  } catch {
    /* localStorage / matchMedia may be unavailable */
  }
})();

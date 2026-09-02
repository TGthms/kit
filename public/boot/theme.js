(function () {
  try {
    var root = document.documentElement;
    var stored = localStorage.getItem("theme") || "system";
    var theme =
      stored === "system"
        ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : stored;
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

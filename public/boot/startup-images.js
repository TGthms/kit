/** Native launch metadata is registered before hydration. Only this device's
 * four images are relevant; rendering all device permutations in React would
 * repeat their markup in every HTML and Flight payload. Artwork URLs stay the
 * same, including the framework-free installed entry. */
(function () {
  try {
    var script = document.getElementById("kit-document-boot");
    var screens = JSON.parse(script.getAttribute("data-startup-screens") || "[]");
    var width = Math.min(screen.width, screen.height);
    var height = Math.max(screen.width, screen.height);
    var scale = window.devicePixelRatio || 1;
    var match = screens.find(function (s) { return s.width === width && s.height === height && s.scale === scale; });
    if (!match) return;
    var prefix = script.getAttribute("data-base-path") || "";
    var version = script.getAttribute("data-startup-version") || "";
    ["portrait", "landscape"].forEach(function (orientation) {
      ["light", "dark"].forEach(function (appearance) {
        var link = document.createElement("link");
        link.rel = "apple-touch-startup-image";
        link.media = "screen and (device-width: " + match.width + "px) and (device-height: " + match.height + "px) and (-webkit-device-pixel-ratio: " + scale + ") and (orientation: " + orientation + ") and (prefers-color-scheme: " + appearance + ")";
        link.href = prefix + "/startup/" + width + "-" + height + "-" + scale + "-" + orientation + "-" + appearance + ".png?v=" + version;
        document.head.appendChild(link);
      });
    });
  } catch { /* Unsupported devices use the platform's normal launch surface. */ }
})();

"use strict";
/* eslint @typescript-eslint/no-require-imports: "off" -- Loaded synchronously by Next's CommonJS lint plugin. */

const { globSync, isDynamicPattern } = require("tinyglobby");
const { statSync } = require("node:fs");
const { isAbsolute, resolve, normalize } = require("node:path");

// Next's ESLint plugin uses exactly this one API for settings.next.rootDir.
// Keep directory matching semantics without its unpatched braces dependency.
// This scoped adapter is not a general fast-glob replacement.
exports.globSync = (patterns, options) => {
  for (const pattern of [patterns].flat()) {
    if (typeof pattern !== "string" || pattern.length > 4096) throw new RangeError("ESLint rootDir glob is too large.");
    let depth = 0;
    for (const char of pattern) {
      if (char === "{" && ++depth > 32) throw new RangeError("ESLint rootDir glob is too deeply nested.");
      if (char === "}") depth = Math.max(0, depth - 1);
    }
  }
  return [...new Set([patterns].flat().flatMap((pattern) => {
    // Exact directory names (including cwd itself) need no glob parser.
    if (!isDynamicPattern(pattern)) {
      try {
        const info = statSync(resolve(options?.cwd ?? process.cwd(), pattern));
        if (options?.onlyDirectories && !info.isDirectory()) return [];
        return [normalize(pattern).replace(/\/$/, "") || "/"];
      } catch { return []; }
    }
    return globSync(pattern, {
      ...options,
      absolute: isAbsolute(pattern),
      expandDirectories: false,
    }).map((path) => path.length > 1 ? path.replace(/\/$/, "") : path);
  }))];
};

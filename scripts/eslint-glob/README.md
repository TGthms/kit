# Next ESLint glob compatibility

The installed Next ESLint plugin's only `fast-glob` call is `globSync(pattern,
{onlyDirectories: true})` in `dist/utils/get-root-dirs.js`. Its dependency chain
includes `braces`, which has no patched release for GHSA-vfj7-8cjw-p6xm.

The root `fast-glob` development dependency points to this local package, and
the plugin's scoped override references it with npm's `$fast-glob` syntax.
The package override applies only to that plugin. This small adapter uses
tinyglobby with directory expansion disabled to preserve fast-glob's behavior.
It rejects oversized/deeply nested configuration patterns. It changes no Next
lint rules or audit settings and is never shipped in the browser.

The adjacent regression tests exercise the plugin itself with exact and globbed
root directories. Recheck that API whenever upgrading eslint-config-next; remove
this override when its upstream dependency chain is repaired.

// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { notFoundCopy } from "@/lib/i18n/not-found-copy";

/*
 * The one document that answers every missing address, read in the language of
 * the address it is answering for.
 *
 * The swap happens in the browser, so it is exercised in one: the wording comes
 * from the same table the build writes into the document, and the address is set
 * the way a visitor's would be — including on the backup host, which serves the
 * whole site under a base path that has to come off before the first segment
 * means anything at all.
 */
const here = dirname(fileURLToPath(import.meta.url));
const boot = readFileSync(join(here, "../../../public/boot/not-found.js"), "utf8");

/** The document, at the address a visitor asked for, with the script run. */
async function openAt(address: string, base = "") {
  const copy = await notFoundCopy();
  document.head.innerHTML = "<title>Kit — Browser tools that stay private</title>";
  document.body.innerHTML = [
    '<h1 id="kit-not-found-title">Page not found</h1>',
    '<p id="kit-not-found-body">That address isn’t in Kit.</p>',
    `<a id="kit-not-found-home" href="${base}/en/">Back to home</a>`,
    `<script type="application/json" id="kit-not-found-copy">${JSON.stringify(copy)}</script>`,
  ].join("");
  window.history.replaceState({}, "", `${base}${address}`);

  const script = document.createElement("script");
  script.setAttribute("data-base-path", base);
  script.setAttribute("data-site-name", "Kit");
  script.textContent = boot;
  document.body.appendChild(script);

  return {
    title: document.title,
    heading: document.getElementById("kit-not-found-title")?.textContent,
    body: document.getElementById("kit-not-found-body")?.textContent,
    wayBack: document.getElementById("kit-not-found-home")?.getAttribute("href"),
  };
}

describe("a missing address in a language", () => {
  it("is read in the language the address named", async () => {
    const { heading, body, title, wayBack } = await openAt("/fr/tools/pdf-merg/");

    expect(heading).toBe("Page introuvable");
    expect(body).toContain("Kit");
    expect(title).toBe("Page introuvable — Kit");
    /* The way back leaves for the language of the address, not the default. */
    expect(wayBack).toBe("/fr/");
  });

  it("is read in the default language when the address names none", async () => {
    const { heading, wayBack } = await openAt("/blog/2024/something/");

    expect(heading).toBe("Page not found");
    expect(wayBack).toBe("/en/");
  });

  it("is read under the base path the backup host serves the site from", async () => {
    /* The whole site sits under `/kit` there, so the base has to come off
       before the first segment means anything, and the way back keeps it. */
    const { heading, wayBack } = await openAt("/ja/tools/nope/", "/kit");

    expect(heading).toBe("ページが見つかりません");
    expect(wayBack).toBe("/kit/ja/");
  });

  it("is read through an address the site answers on for a language it has", async () => {
    const { heading, wayBack } = await openAt("/zh/tools/nope/");

    expect(heading).toBe("找不到页面");
    expect(wayBack).toBe("/zh/");
  });
});

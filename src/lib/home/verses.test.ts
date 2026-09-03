import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GOOD_FRIDAY_VERSE_ID, WEB_VERSES } from "./verses";

const WEB_JOHN_19_30 =
  'When Jesus therefore had received the vinegar, he said, "It is finished." He bowed his head, and gave up his spirit.';

describe("WEB verses", () => {
  it("keeps John 19:30 as the public-domain WEB wording", () => {
    expect(WEB_VERSES.john1930.text).toBe(WEB_JOHN_19_30);
    expect(WEB_VERSES.john1930.citation).toBe("John 19:30 (WEB)");
    expect(GOOD_FRIDAY_VERSE_ID).toBe("john1930");
  });

  it("does not copy the verse into locale catalogs", () => {
    const dir = path.join(process.cwd(), "messages");
    for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".json"))) {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      expect(raw.includes(WEB_JOHN_19_30), `${file} translated or duplicated the WEB verse`).toBe(false);
      expect(raw.includes("John 19:30 (WEB)"), `${file} stored the WEB citation`).toBe(false);
    }
  });
});

import { describe, expect, it } from "vitest";
import { formatSql } from "./sql";

describe("formatSql", () => {
  it("uppercases keywords and breaks major clauses", () => {
    expect(formatSql("select id, name from users where id = 1")).toEqual({
      ok: true,
      text: "SELECT id,\nname\nFROM users\nWHERE id = 1\n",
    });
  });

  it("indents parenthesized lists", () => {
    expect(formatSql("insert into t (a, b) values (1, 2)")).toEqual({
      ok: true,
      text: "INSERT INTO t (\n  a,\n  b\n)\nVALUES (\n  1,\n  2\n)\n",
    });
  });

  it("keeps escaped quotes inside strings from splitting the token", () => {
    expect(formatSql("select * from t where s = 'it\\'s'")).toEqual({
      ok: true,
      text: "SELECT *\nFROM t\nWHERE s = 'it\\'s'\n",
    });
  });

  it("separates joins with blank lines", () => {
    expect(
      formatSql("SELECT * FROM t WHERE x = 1 join orders o on o.uid = t.id left join ship s on s.oid = o.id")
    ).toEqual({
      ok: true,
      text:
        "SELECT *\nFROM t\nWHERE x = 1\n\nJOIN orders o ON o.uid = t.id\n\nLEFT\n\nJOIN ship s ON s.oid = o.id\n",
    });
  });

  it("keeps comments on their own lines", () => {
    expect(formatSql("select 1 -- trailing note")).toEqual({
      ok: true,
      text: "SELECT 1\n-- trailing note\n",
    });
  });

  it("rejects empty input", () => {
    expect(formatSql("   ")).toEqual({ ok: false, error: "Empty SQL" });
  });
});

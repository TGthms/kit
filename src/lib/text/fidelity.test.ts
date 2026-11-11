import { expect, it } from "vitest";
import { formatJson, jsonToCsv } from "./core";
import { convertCase } from "./case";
import { explainCron } from "./cron";
import { formatSql } from "./sql";
import { parseTimestamp } from "./timestamp";
it.each(['{"id":9007199254740993}', '{"n":1e400}', '{"n":1e-400}', '{"n":1.0000000000000001}'])("refuses lossy JSON %s", input => {
  expect(formatJson(input).ok).toBe(false);
});
it("keeps ordinary decimals, exact exponent notation, and quoted identifiers", () => {
  const result = formatJson('{"id":"9007199254740993","n":1.3,"tiny":1e-20,"zero":-0,"escaped":"a\\\"123"}');
  expect(result.ok).toBe(true);
});
it("preserves SQL literal data and bracket names", () => {
  const literal = '$body$hello   from\n\n\nworld$body$';
  const result = formatSql(`select ${literal}, [order  by] from t`);
  expect(result.ok && result.text).toContain(literal);
  expect(result.ok && result.text).toContain('[order  by]');
  expect(formatSql('SELECT $$unclosed').ok).toBe(false);
});
it("preserves Unicode in identifier case styles and splits acronyms", () => {
  expect(convertCase('你好世界', 'snake')).toBe('你好世界');
  expect(convertCase('café déjà vu', 'snake')).toBe('café_déjà_vu');
  expect(convertCase('XMLHttpRequest', 'snake')).toBe('xml_http_request');
});
it.each(['99 99 99 99 99', '*/0 * * * *', '* 24 * * *', '* * 0 * *', '* * * 13 *', '* * * * 8', '1-0 * * * *', '* * * * MON'])("refuses invalid cron %s", input => {
  expect(explainCron(input).ok).toBe(false);
});
it("validates lists, steps and Sunday aliases", () => {
  const result = explainCron('0,30 9-17/2 1 * 7');
  expect(result.ok && result.schedule[1].values).toEqual([9, 11, 13, 15, 17]);
  expect(result.ok && result.schedule[4].values).toEqual([0]);
  expect(result.ok && result.dayUnion).toBe(true);
});
it("escapes spreadsheet formulae by default with an explicit raw mode", () => {
  const input = '[{"value":"=1+1"},{"value":"@SUM(A1)"}]';
  expect(jsonToCsv(input)).toMatchObject({ ok: true, text: expect.stringContaining("'=1+1") });
  expect(jsonToCsv(input, false)).toMatchObject({ ok: true, text: expect.not.stringContaining("'=1+1") });
});
it("resolves early timestamps by the selected unit", () => {
  expect(parseTimestamp('86400000', 'milliseconds')).toMatchObject({ ok: true, iso: '1970-01-02T00:00:00.000Z' });
  expect(parseTimestamp('86400', 'seconds')).toMatchObject({ ok: true, iso: '1970-01-02T00:00:00.000Z' });
});

it("refuses YAML integers and infinities that JSON cannot preserve", async () => {
  const { parseToolYaml } = await import("./core");
  expect(() => parseToolYaml("id: 9007199254740993")).toThrow("lose precision");
  expect(() => parseToolYaml("value: .inf")).toThrow("Non-finite");
  expect(parseToolYaml('id: "9007199254740993"\ncount: 2')).toEqual({ id: "9007199254740993", count: 2 });
});

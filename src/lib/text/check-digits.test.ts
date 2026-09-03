import { describe, expect, it } from "vitest";
import { ean13Check, ibanCheck, isbn10Check, isbn13Check, normalizeDigits } from "./check-digits";

describe("check digit helpers", () => {
  it("normalizes spaces and hyphens", () => {
    expect(normalizeDigits("978-0-306-40615-7")).toBe("9780306406157");
    expect(normalizeDigits("GB82 WEST 1234 5698 7654 32")).toBe("GB82WEST12345698765432");
  });

  it("validates ISBN-10 and ISBN-13 / EAN-13", () => {
    expect(isbn13Check("978-0-306-40615-7")).toEqual({ ok: true, normalized: "9780306406157" });
    expect(isbn13Check("9780306406158")).toEqual({ ok: false, normalized: "9780306406158" });
    expect(ean13Check("4006381333931")).toEqual({ ok: true, normalized: "4006381333931" });
    expect(isbn10Check("0-306-40615-2")).toEqual({ ok: true, normalized: "0306406152" });
    expect(isbn10Check("043942089X")).toEqual({ ok: true, normalized: "043942089X" });
    expect(isbn10Check("0306406153")).toEqual({ ok: false, normalized: "0306406153" });
  });

  it("validates IBAN mod-97", () => {
    expect(ibanCheck("GB82 WEST 1234 5698 7654 32")).toEqual({ ok: true, normalized: "GB82WEST12345698765432" });
    expect(ibanCheck("GB82WEST12345698765431")).toEqual({ ok: false, normalized: "GB82WEST12345698765431" });
    expect(ibanCheck("SHORT")).toMatchObject({ ok: false });
  });
});

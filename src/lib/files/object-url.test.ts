import { afterEach, describe, expect, it, vi } from "vitest";
import { replaceObjectUrlRecord, revokeObjectUrl, revokeObjectUrls } from "./object-url";

describe("object URL helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("revokes blob URLs and ignores data URLs", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    revokeObjectUrl("blob:https://kit.local/a");
    revokeObjectUrl("data:image/jpeg;base64,xx");
    revokeObjectUrl(undefined);
    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:https://kit.local/a");
  });

  it("replaces a record by revoking the previous values", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const next = replaceObjectUrlRecord({ a: "blob:old-a", b: "blob:old-b" }, { a: "blob:new-a" });
    expect(next).toEqual({ a: "blob:new-a" });
    expect(revoke).toHaveBeenCalledTimes(2);
    revokeObjectUrls(["blob:new-a"]);
    expect(revoke).toHaveBeenCalledTimes(3);
  });
});

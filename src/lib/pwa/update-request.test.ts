import { expect, it, vi } from "vitest";
import { requestWorkerUpdate } from "./update-request";
function registration(scope: string) {
  return {
    scope,
    installing: null as unknown,
    update: vi.fn().mockResolvedValue(undefined),
  };
}
it("deduplicates update jobs across wrappers for the same scope", async () => {
  const first = registration("https://kit.test/kit/"),
    second = registration(first.scope);
  let finish!: () => void;
  first.update.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const a = requestWorkerUpdate(first as unknown as ServiceWorkerRegistration),
    b = requestWorkerUpdate(second as unknown as ServiceWorkerRegistration);
  expect(a).toBe(b);
  await Promise.resolve();
  expect(first.update).toHaveBeenCalledOnce();
  expect(second.update).not.toHaveBeenCalled();
  finish();
  await a;
  await requestWorkerUpdate(second as unknown as ServiceWorkerRegistration);
  expect(second.update).toHaveBeenCalledOnce();
});
it("lets a live installer finish but permits a discarded installer to retry", async () => {
  const value = registration("https://kit.test/installing/");
  value.installing = { state: "installing" };
  await requestWorkerUpdate(value as unknown as ServiceWorkerRegistration);
  expect(value.update).not.toHaveBeenCalled();
  value.installing = { state: "redundant" };
  await requestWorkerUpdate(value as unknown as ServiceWorkerRegistration);
  expect(value.update).toHaveBeenCalledOnce();
});
it("releases a failed job and keeps different app scopes independent", async () => {
  const first = registration("https://kit.test/a/"),
    second = registration("https://kit.test/b/");
  first.update.mockRejectedValueOnce(new Error("offline"));
  await expect(
    requestWorkerUpdate(first as unknown as ServiceWorkerRegistration),
  ).rejects.toThrow("offline");
  await Promise.all([
    requestWorkerUpdate(first as unknown as ServiceWorkerRegistration),
    requestWorkerUpdate(second as unknown as ServiceWorkerRegistration),
  ]);
  expect(first.update).toHaveBeenCalledTimes(2);
  expect(second.update).toHaveBeenCalledOnce();
});

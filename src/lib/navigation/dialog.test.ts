// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { hasOpenDialog } from "./dialog";
afterEach(() => { document.body.innerHTML = ""; });
it("recognizes every modal implementation without treating a closed native dialog as open", () => {
  expect(hasOpenDialog()).toBe(false);
  document.body.innerHTML = '<dialog></dialog>';
  expect(hasOpenDialog()).toBe(false);
  document.body.innerHTML = '<dialog open></dialog>';
  expect(hasOpenDialog()).toBe(true);
  document.body.innerHTML = '<div role="dialog" aria-modal="true"></div>';
  expect(hasOpenDialog()).toBe(true);
  document.body.innerHTML = '<section role="alertdialog"></section>';
  expect(hasOpenDialog()).toBe(true);
});

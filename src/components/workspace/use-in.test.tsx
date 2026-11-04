// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import en from "../../../messages/en.json";
import { UseIn } from "./use-in";
import { clearHandoff, takeHandoff } from "@/lib/workspace/handoff";
const { push, held } = vi.hoisted(() => ({ push: vi.fn(), held: vi.fn() }));
vi.mock("@/lib/i18n/navigation", () => ({
  usePathname: () => "/tools/image-convert",
  useRouter: () => ({ push }),
}));
vi.mock("@/lib/pwa/offline-navigation", () => ({ isHeldOffline: held }));
afterEach(() => {
  cleanup();
  clearHandoff();
  push.mockReset();
  held.mockReset();
  vi.restoreAllMocks();
});
function setup() {
  const failed = vi.fn();
  const view = render(
    <NextIntlClientProvider locale="en" messages={en}>
      <UseIn
        files={[
          {
            name: "photo.png",
            blob: new Blob(["pixels"], { type: "image/png" }),
          },
        ]}
        disabled={false}
        onError={failed}
      />
    </NextIntlClientProvider>,
  );
  return { ...view, failed };
}
it("preserves the result when its destination is not saved offline", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  held.mockResolvedValue(false);
  const { failed } = setup();
  fireEvent.click(
    screen.getByRole("button", { name: en.tools["images-to-pdf"].name }),
  );
  await waitFor(() => expect(failed).toHaveBeenCalledWith("offline"));
  expect(push).not.toHaveBeenCalled();
  expect(takeHandoff("images-to-pdf")).toBeNull();
  expect(held.mock.calls[0][0]).toContain("/en/tools/images-to-pdf");
});
it("passes the actual image to a saved offline destination", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  held.mockResolvedValue(true);
  setup();
  fireEvent.click(
    screen.getByRole("button", { name: en.tools["images-to-pdf"].name }),
  );
  await waitFor(() => expect(push).toHaveBeenCalledOnce());
  expect(takeHandoff("images-to-pdf")?.[0].name).toBe("photo.png");
});
it("does not navigate after leaving during an offline probe", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  let complete!: (value: boolean) => void;
  held.mockReturnValue(
    new Promise<boolean>((resolve) => {
      complete = resolve;
    }),
  );
  const view = setup();
  fireEvent.click(
    screen.getByRole("button", { name: en.tools["images-to-pdf"].name }),
  );
  view.unmount();
  await act(async () => complete(true));
  expect(push).not.toHaveBeenCalled();
  expect(takeHandoff("images-to-pdf")).toBeNull();
});
it("makes a failed availability probe recoverable without navigating", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  held.mockRejectedValue(new Error("storage unavailable"));
  const { failed } = setup();
  fireEvent.click(
    screen.getByRole("button", { name: en.tools["images-to-pdf"].name }),
  );
  await waitFor(() => expect(failed).toHaveBeenCalledWith());
  expect(push).not.toHaveBeenCalled();
});

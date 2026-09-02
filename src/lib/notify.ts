import { toast } from "sonner";
import { useHistoryStore } from "@/stores/history-store";

const NOTICE_ID = "kit-notice";
const ERROR_ID = "kit-error";

export function notifySuccess(message: string) {
  toast.success(message, { id: NOTICE_ID });
}

export function notifyError(message: string) {
  toast.error(message, { id: ERROR_ID });
}

/** Record-to-history actions: never claim a save when recording is off. */
export function notifyHistorySaved(savedMessage: string, skippedMessage: string) {
  if (useHistoryStore.getState().enabled) toast.success(savedMessage, { id: NOTICE_ID });
  else toast(skippedMessage, { id: NOTICE_ID });
}

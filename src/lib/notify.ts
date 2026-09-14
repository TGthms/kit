import { toast } from "sonner";

const NOTICE_ID = "kit-notice";
const ERROR_ID = "kit-error";
/* Its own id, so the confirmation stands on its own rather than replacing the
   notice: taking an action dismisses the notice it belonged to. */
const HISTORY_ENABLED_ID = "kit-history-enabled";
/* Long enough to read the sentence and decide, where the usual notice is only
   meant to be glimpsed. */
const HISTORY_OFF_MS = 8000;

export function notifySuccess(message: string) {
  toast.success(message, { id: NOTICE_ID });
}

export function notifyError(message: string) {
  toast.error(message, { id: ERROR_ID });
}

/**
 * Recording is off, so nothing was saved. Rather than only saying so, the
 * notice carries the way to turn it on — and the caller keeps the action that
 * prompted it, so a visitor who wants recording does not have to take the
 * action a second time.
 */
export function notifyHistoryOff(message: string, actionLabel: string, onEnable: () => void) {
  toast(message, {
    id: NOTICE_ID,
    duration: HISTORY_OFF_MS,
    action: { label: actionLabel, onClick: onEnable },
  });
}

/**
 * Recording is on, and the action that asked for it was kept. Told as its own
 * notice because the one it answers has just been dismissed.
 */
export function notifyHistoryEnabled(message: string) {
  toast.success(message, { id: HISTORY_ENABLED_ID });
}

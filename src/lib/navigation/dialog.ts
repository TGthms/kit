/** Includes native dialogs, Kit's shortcut overlay and React Aria alerts,
 * which deliberately omit aria-modal for Safari compatibility. */
export function hasOpenDialog(): boolean {
  return !!document.querySelector('dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"]');
}

"use client";

import { useId, type ReactNode } from "react";
import { AlertDialog } from "@heroui/react/alert-dialog";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { HeroButton } from "./hero-button";

type ConfirmDialogProps = {
  locale: string;
  trigger: ReactNode;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm(): void;
};

/** Destructive confirmation: outside taps never confirm, Escape cancels, the
 * least destructive action receives initial focus, and React Aria restores
 * focus/scroll when closed. Copy stays with the calling feature. */
export function ConfirmDialog({ locale, trigger, title, description, cancelLabel, confirmLabel, onConfirm }: ConfirmDialogProps) {
  const descriptionId = useId();
  return (
    <I18nProvider locale={locale}><AlertDialog>
      {trigger}
      <AlertDialog.Backdrop className="kit-hero" isKeyboardDismissDisabled={false}>
        <AlertDialog.Container placement="center" size="sm">
          {/* React Aria deliberately uses inert/hidden background content
              instead of aria-modal to avoid Safari focus bug 211934. */}
          <AlertDialog.Dialog aria-describedby={descriptionId}>
            {({ close }) => <>
              <AlertDialog.Header><AlertDialog.Heading>{title}</AlertDialog.Heading></AlertDialog.Header>
              <AlertDialog.Body><p id={descriptionId}>{description}</p></AlertDialog.Body>
              <AlertDialog.Footer>
                <HeroButton autoFocus variant="tertiary" onPress={close}>{cancelLabel}</HeroButton>
                <HeroButton variant="danger" onPress={() => { onConfirm(); close(); }}>{confirmLabel}</HeroButton>
              </AlertDialog.Footer>
            </>}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog></I18nProvider>
  );
}

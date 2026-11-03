"use client";
import { useEffect, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { Modal } from "@heroui/react/modal";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { HeroButton } from "./hero-button";
import { hideMathKeyboard } from "@/lib/math/keyboard";
import "./hero-controls.css";

/** Shared help/review overlay: React Aria owns focus containment, restoration,
 * scroll locking and background hiding, including Safari's modality workaround. */
export function ModalSurface({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const locale = useLocale();
  useEffect(() => {
    if (open) hideMathKeyboard();
  }, [open]);
  return (
    <I18nProvider locale={locale}>
      <Modal.Backdrop
        className="kit-hero"
        isOpen={open}
        onOpenChange={onOpenChange}
        isDismissable
      >
        <Modal.Container placement="center" size="lg" scroll="inside">
          <Modal.Dialog data-kit-modal>
            <Modal.Header className="flex items-center justify-between gap-3">
              <Modal.Heading>{title}</Modal.Heading>
              <HeroButton
                variant="ghost"
                aria-label={closeLabel}
                onPress={() => onOpenChange(false)}
              >
                ×
              </HeroButton>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </I18nProvider>
  );
}

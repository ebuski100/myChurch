"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { Button, LoadingButton } from "./button";

type ModalDialogProps = {
  open: boolean;
  onClose: () => void;
  closeBlocked?: boolean;
  role?: "dialog" | "alertdialog";
  id?: string;
  titleId: string;
  descriptionId?: string;
  panelClassName?: string;
  children: ReactNode;
};

export function ModalDialog({
  open,
  onClose,
  closeBlocked = false,
  role = "dialog",
  id,
  titleId,
  descriptionId,
  panelClassName = "max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl",
  children,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeBlockedRef = useRef(closeBlocked);
  const onCloseRef = useRef(onClose);

  useLayoutEffect(() => {
    closeBlockedRef.current = closeBlocked;
    onCloseRef.current = onClose;
  }, [closeBlocked, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusableElements = () =>
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );

    focusableElements()?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!closeBlockedRef.current) onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = focusableElements();
      if (!focusable?.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const focusIsInside = dialogRef.current.contains(
        document.activeElement,
      );

      if (event.shiftKey && (document.activeElement === first || !focusIsInside)) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !focusIsInside)
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open && closeBlocked) dialogRef.current?.focus();
  }, [open, closeBlocked]);

  if (!open) return null;

  return (
    <div
      className="victory-modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#101B33]/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !closeBlockedRef.current
        ) {
          onCloseRef.current();
        }
      }}
    >
      <section
        ref={dialogRef}
        id={id}
        role={role}
        aria-modal="true"
        aria-busy={closeBlocked || undefined}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`victory-modal-panel outline-none ${panelClassName}`}
      >
        {children}
      </section>
      <style jsx>{`
        .victory-modal-backdrop {
          animation: victory-modal-backdrop-in 180ms ease-out both;
        }

        .victory-modal-panel {
          animation: victory-modal-panel-in 180ms
            cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes victory-modal-backdrop-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes victory-modal-panel-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .victory-modal-backdrop,
          .victory-modal-panel {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <ModalDialog
      open={open}
      onClose={onCancel}
      closeBlocked={pending}
      role="alertdialog"
      titleId="admin-confirmation-title"
      descriptionId="admin-confirmation-description"
      panelClassName="w-full max-w-md rounded-t-3xl border border-[#E4E7EC] bg-white shadow-2xl sm:rounded-3xl"
    >
      <div className="p-6 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9A772E]">
          Confirm action
        </p>
        <h2
          id="admin-confirmation-title"
          className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[#101B33]"
        >
          {title}
        </h2>
        <div
          id="admin-confirmation-description"
          className="mt-3 text-sm leading-6 text-[#667085]"
        >
          {description}
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="min-h-11 rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB]"
          >
            Cancel
          </Button>
          <LoadingButton
            type="button"
            pending={pending}
            pendingLabel={pendingLabel}
            disabled={pending}
            onClick={onConfirm}
            className={
              destructive
                ? "min-h-11 rounded-full bg-[#8A4242] px-5 text-sm font-semibold text-white hover:bg-[#713535] focus-visible:outline-[#8A4242]"
                : "min-h-11 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653]"
            }
          >
            {confirmLabel}
          </LoadingButton>
        </div>
      </div>
    </ModalDialog>
  );
}

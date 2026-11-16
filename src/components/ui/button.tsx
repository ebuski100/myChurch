"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 transition-colors active:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${buttonBaseClass} ${className}`}
    />
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none ${className}`}
    />
  );
}

export function LoadingButton({
  children,
  className,
  disabled,
  pending: pendingOverride,
  pendingLabel,
  type = "submit",
  ...props
}: ButtonProps & {
  pending?: boolean;
  pendingLabel?: ReactNode;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingOverride ?? formPending;

  return (
    <Button
      {...props}
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={className}
    >
      <span className="grid">
        <span
          aria-hidden={pending || undefined}
          className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${
            pending ? "invisible" : ""
          }`}
        >
          {children}
        </span>
        <span
          aria-hidden={!pending || undefined}
          className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-2 ${
            pending ? "" : "invisible"
          }`}
        >
          <Spinner />
          {pendingLabel ?? children}
        </span>
      </span>
    </Button>
  );
}

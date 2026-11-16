"use client";

import { useEffect, useRef, useState } from "react";
import { createAdminNoticeTimer } from "@/lib/admin-notice-timer";

type NoticeKind = "success" | "error" | "warning" | "info";

const noticeStyles: Record<NoticeKind, string> = {
  success: "border-[#CFE5D5] bg-[#F0F8F2] text-[#3C704B]",
  error: "border-[#F0D4D4] bg-[#FBF5F5] text-[#8A4242]",
  warning: "border-[#F3E1B7] bg-[#FFFBF2] text-[#765A22]",
  info: "border-[#E4E7EC] bg-white text-[#475467]",
};

export function AdminNotice({
  message,
  kind,
  resetKey,
  persistent = false,
  clearQueryParams,
  className = "",
  children,
}: {
  message: string;
  kind: NoticeKind;
  resetKey?: unknown;
  persistent?: boolean;
  clearQueryParams?: Record<string, string>;
  className?: string;
  children?: React.ReactNode;
}) {
  const [dismissedKey, setDismissedKey] = useState<unknown>(null);
  const timerRef = useRef<ReturnType<typeof createAdminNoticeTimer> | null>(
    null,
  );
  const pointerInsideRef = useRef(false);
  const focusInsideRef = useRef(false);
  const resetValue = resetKey ?? message;
  const dismissed = dismissedKey === resetValue;
  const shouldPersist = persistent || kind === "error";

  useEffect(() => {
    if (shouldPersist) return;

    const timer = createAdminNoticeTimer(
      () => {
        setDismissedKey(resetValue);
        if (
          !clearQueryParams ||
          Object.keys(clearQueryParams).length === 0
        )
          return;

        const url = new URL(window.location.href);
        for (const [key, expectedValue] of Object.entries(
          clearQueryParams,
        )) {
          if (url.searchParams.get(key) === expectedValue)
            url.searchParams.delete(key);
        }
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
      },
      window,
      5000,
    );
    timerRef.current = timer;
    if (!pointerInsideRef.current && !focusInsideRef.current) {
      timer.start();
    }

    return () => {
      timer.clear();
      if (timerRef.current === timer) timerRef.current = null;
    };
  }, [shouldPersist, clearQueryParams, resetValue]);

  if (dismissed) return null;

  function dismiss() {
    pointerInsideRef.current = false;
    focusInsideRef.current = false;
    timerRef.current?.clear();
    setDismissedKey(resetValue);
  }

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
      onMouseEnter={() => {
        pointerInsideRef.current = true;
        timerRef.current?.clear();
      }}
      onMouseLeave={() => {
        pointerInsideRef.current = false;
        if (!focusInsideRef.current) timerRef.current?.start();
      }}
      onFocusCapture={() => {
        focusInsideRef.current = true;
        timerRef.current?.clear();
      }}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          !(nextTarget instanceof Node) ||
          !event.currentTarget.contains(nextTarget)
        ) {
          focusInsideRef.current = false;
          if (!pointerInsideRef.current) timerRef.current?.start();
        }
      }}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${noticeStyles[kind]} ${className}`}
    >
      <div className="min-w-0 flex-1">
        {message}
        {children}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 grid size-11 shrink-0 place-items-center rounded-full text-current/75 hover:bg-black/5 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

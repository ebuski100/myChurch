"use client";

import { useEffect, useState } from "react";
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
  const resetValue = resetKey ?? message;
  const dismissed = dismissedKey === resetValue;

  useEffect(() => {
    if (persistent) return;

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
      3000,
    );
    timer.start();

    return () => timer.clear();
  }, [persistent, clearQueryParams, resetValue]);

  if (dismissed) return null;

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${noticeStyles[kind]} ${className}`}
    >
      <div className="min-w-0 flex-1">
        {message}
        {children}
      </div>
      <button
        type="button"
        onClick={() => setDismissedKey(resetValue)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-current/75 hover:bg-black/5 hover:text-current focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

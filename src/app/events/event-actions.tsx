"use client";

import { useState } from "react";
import {
  buildEventCalendarFile,
  type EventCalendarDetails,
} from "@/lib/event-public-details";

export function EventActions({
  event,
}: {
  event: EventCalendarDetails;
}) {
  const [message, setMessage] = useState("");

  async function copyEventLink(url: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }

    const input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Clipboard copy was not available.");
  }

  async function shareEvent() {
    const url = window.location.href;
    setMessage("");
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description ?? undefined,
          url,
        });
        setMessage("Event shared.");
        return;
      }
      await copyEventLink(url);
      setMessage("Event link copied.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        return;
      try {
        await copyEventLink(url);
        setMessage("Event link copied.");
      } catch {
        setMessage("Sharing is unavailable in this browser.");
      }
    }
  }

  function downloadCalendar() {
    try {
      const content = buildEventCalendarFile({
        ...event,
        url: window.location.href,
      });
      const objectUrl = URL.createObjectURL(
        new Blob([content], { type: "text/calendar;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `victorycity-event-${event.id}.ics`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setMessage("Calendar file downloaded.");
    } catch {
      setMessage("The calendar file could not be created.");
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={shareEvent}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#9A772E]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="size-4"
          >
            <circle
              cx="15"
              cy="4"
              r="2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle
              cx="5"
              cy="10"
              r="2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <circle
              cx="15"
              cy="16"
              r="2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="m7 9 6-4M7 11l6 4"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
          Share event
        </button>
        <button
          type="button"
          onClick={downloadCalendar}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#D0D5DD] bg-white px-5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#9A772E]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="size-4"
          >
            <rect
              x="3"
              y="4"
              width="14"
              height="13"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M6 2.5v3M14 2.5v3M3 8h14m-7 3v4m-2-2 2 2 2-2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add to calendar
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 text-sm text-[#667085]"
      >
        {message}
      </p>
    </div>
  );
}

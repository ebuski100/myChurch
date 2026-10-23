"use client";

import { useActionState } from "react";
import { AdminNotice } from "../../../admin-notice";
import {
  changeSermonLifecycleAction,
  type PublicationActionState,
} from "../../publication-actions";
import {
  formatScheduledDate,
  type SermonLifecycleCommand,
} from "@/lib/sermon-lifecycle";

const initialState: PublicationActionState = {};

function LifecycleForm({
  resourceId,
  command,
  title,
}: {
  resourceId: string;
  command: SermonLifecycleCommand;
  title: string;
}) {
  const action = changeSermonLifecycleAction.bind(null, resourceId);
  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );
  const labels: Record<SermonLifecycleCommand, string> = {
    publish: "Publish sermon now",
    schedule: "Save schedule",
    unpublish: "Unpublish sermon",
    cancel_schedule: "Cancel scheduled publication",
    archive: "Archive sermon",
    restore: "Restore as draft",
  };
  const confirmation: Record<SermonLifecycleCommand, string> = {
    publish: `I confirm “${title}” is ready for the public library now.`,
    schedule: `I confirm “${title}” should remain private until its scheduled time.`,
    unpublish: `I confirm “${title}” should be removed from the public library.`,
    cancel_schedule: `I confirm the scheduled publication for “${title}” should be cancelled.`,
    archive: `I confirm “${title}” should be archived and removed from the public library.`,
    restore: `I confirm “${title}” should be restored as a private draft.`,
  };
  const showScheduleField = command === "schedule";

  return (
    <form
      action={formAction}
      className="mt-4 space-y-4 rounded-xl border border-[#EAECF0] p-4"
    >
      <input type="hidden" name="command" value={command} />
      {showScheduleField && (
        <div>
          <label
            htmlFor={`scheduled-at-${resourceId}`}
            className="mb-2 block text-sm font-semibold text-[#344054]"
          >
            Publication date and time (Africa/Lagos, WAT)
          </label>
          <input
            id={`scheduled-at-${resourceId}`}
            name="scheduledAt"
            type="datetime-local"
            required
            disabled={pending}
            className="min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#101B33] focus:border-[#9A772E] focus:outline-none focus:ring-2 focus:ring-[#D9B66D]/30"
          />
          <p className="mt-1 text-xs leading-5 text-[#667085]">
            The selected time is interpreted in Africa/Lagos. The
            sermon remains private until a configured scheduler
            processes it.
          </p>
        </div>
      )}
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#344054]">
        <input
          type="checkbox"
          name="confirmation"
          value="yes"
          required
          disabled={pending}
          className="mt-1 size-4 accent-[#9A772E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] disabled:cursor-not-allowed"
        />
        <span>{confirmation[command]}</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white hover:bg-[#263653] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
      >
        {pending ? "Saving status…" : labels[command]}
      </button>
      <span className="sr-only" aria-live="polite">
        {pending ? "Updating sermon status" : ""}
      </span>
      {state.message && (
        <AdminNotice
          message={state.message}
          kind={state.success ? "success" : "error"}
          resetKey={state}
        />
      )}
    </form>
  );
}

export function PublicationControls({
  resourceId,
  title,
  status,
  publishedAt,
}: {
  resourceId: string;
  title: string;
  status: "draft" | "scheduled" | "published" | "archived";
  publishedAt: string | null;
}) {
  const common = { resourceId, title };
  return (
    <section
      aria-labelledby="sermon-publication-heading"
      className="mt-5 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-7"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
        Separate from sermon details
      </p>
      <h2
        id="sermon-publication-heading"
        className="mt-1 text-xl font-semibold tracking-tight text-[#101B33]"
      >
        Publication and archive
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        Current status:{" "}
        <strong className="font-semibold text-[#344054]">
          {status}
        </strong>
        . Saving metadata does not change publication status.
      </p>
      {status === "scheduled" && (
        <p className="mt-2 text-sm text-[#435A82]">
          Scheduled for{" "}
          <strong>
            {formatScheduledDate(publishedAt) ??
              "an invalid stored time"}
          </strong>
          .
        </p>
      )}

      {status === "draft" && (
        <LifecycleForm {...common} command="publish" />
      )}
      {(status === "draft" || status === "scheduled") && (
        <LifecycleForm {...common} command="schedule" />
      )}
      {status === "scheduled" && (
        <LifecycleForm {...common} command="cancel_schedule" />
      )}
      {status === "published" && (
        <LifecycleForm {...common} command="unpublish" />
      )}
      {status !== "archived" && (
        <LifecycleForm {...common} command="archive" />
      )}
      {status === "archived" && (
        <LifecycleForm {...common} command="restore" />
      )}
    </section>
  );
}

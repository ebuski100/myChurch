"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import type { AdminEvent } from "@/lib/admin-event-data";
import {
  EVENT_STATUSES,
  formatLagosDateTimeInput,
  parseLagosDateTimeInput,
  type EventFieldErrors,
  type EventStatus,
  validateEventForm,
} from "@/lib/event-validation";
import { AdminNotice } from "../admin-notice";
import type { EventActionState } from "./actions";

const initialState: EventActionState = {};

type EventFormAction = (
  previous: EventActionState,
  form: FormData,
) => Promise<EventActionState>;

type EventFormValuesState = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  status: EventStatus;
};

const statusLabels = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  archived: "Archived",
} as const;

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  return message ? (
    <p id={`${id}-error`} className="mt-1.5 text-xs text-[#B54747]">
      {message}
    </p>
  ) : null;
}

export function EventForm({
  action,
  event,
  children,
  minStartDateTime,
}: {
  action: EventFormAction;
  event?: AdminEvent;
  children?: ReactNode;
  minStartDateTime: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );
  const formId = event ? `admin-event-form-${event.id}` : undefined;
  const [createIntent, setCreateIntent] = useState<
    "draft" | "published"
  >("draft");
  const [clientValidation, setClientValidation] = useState<{
    errors: EventFieldErrors;
    message: string;
  } | null>(null);
  const [values, setValues] = useState<EventFormValuesState>({
    title: event?.title ?? "",
    description: event?.description ?? "",
    startsAt: formatLagosDateTimeInput(event?.startsAt ?? null),
    endsAt: formatLagosDateTimeInput(event?.endsAt ?? null),
    location: event?.location ?? "",
    status: event?.status ?? ("draft" as EventStatus),
  });
  const errors = {
    ...(state.errors ?? {}),
    ...(clientValidation?.errors ?? {}),
  };

  function updateField<Key extends keyof EventFormValuesState>(
    field: Key,
    value: EventFormValuesState[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setClientValidation(null);
  }

  function validateBeforeSubmit(
    submitEvent: React.FormEvent<HTMLFormElement>,
  ) {
    const formData = new FormData(submitEvent.currentTarget);
    const submitter = (submitEvent.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const intent =
      !event && submitter?.name === "createIntent"
        ? submitter.value
        : createIntent;
    if (!event) formData.set("status", intent);

    const preventPastPublication = !event
      ? intent === "published"
      : event.status !== "published" && values.status === "published";

    const validation = validateEventForm(formData, {
      now: new Date(),
      preventPastPublication,
    });
    setClientValidation(null);
    if (!validation.ok) {
      submitEvent.preventDefault();
      setClientValidation({
        errors: validation.errors,
        message: "Check the highlighted event fields.",
      });
    }
    setCreateIntent(intent === "published" ? "published" : "draft");
  }

  const endTime = values.endsAt
    ? parseLagosDateTimeInput(values.endsAt)
    : null;
  const minimumTime = parseLagosDateTimeInput(minStartDateTime);
  const mayBeOngoing = Boolean(
    endTime &&
    minimumTime &&
    Date.parse(endTime) > Date.parse(minimumTime),
  );
  const preventPastPublication = !event
    ? createIntent === "published"
    : event.status !== "published" && values.status === "published";
  const startMin =
    preventPastPublication && !mayBeOngoing
      ? minStartDateTime
      : undefined;

  return (
    <>
      <form
        id={formId}
        action={formAction}
        onSubmit={validateBeforeSubmit}
        className="space-y-5"
      >
        {(state.message || clientValidation?.message) && (
          <AdminNotice
            message={clientValidation?.message ?? state.message ?? ""}
            kind="error"
            resetKey={clientValidation ?? state}
            persistent={Boolean(
              state.errors || clientValidation?.errors,
            )}
          />
        )}
        <section className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="event-title"
                className="mb-2 block text-sm font-semibold text-[#344054]"
              >
                Event title
              </label>
              <input
                id="event-title"
                name="title"
                type="text"
                required
                maxLength={200}
                value={values.title}
                onChange={(change) =>
                  updateField("title", change.currentTarget.value)
                }
                aria-invalid={Boolean(errors.title)}
                aria-describedby={
                  errors.title ? "event-title-error" : undefined
                }
                className="min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30 aria-[invalid=true]:border-[#B54747]"
              />
              <FieldError id="event-title" message={errors.title} />
            </div>

            <div>
              <label
                htmlFor="event-starts-at"
                className="mb-2 block text-sm font-semibold text-[#344054]"
              >
                Starts (Africa/Lagos, WAT)
              </label>
              <input
                id="event-starts-at"
                name="startsAt"
                type="datetime-local"
                required
                min={startMin}
                value={values.startsAt}
                onChange={(change) =>
                  updateField("startsAt", change.currentTarget.value)
                }
                onInvalid={(invalidEvent) => {
                  if (
                    !invalidEvent.currentTarget.validity
                      .rangeUnderflow
                  )
                    return;
                  setClientValidation({
                    errors: {
                      startsAt:
                        "A newly published event must start in the future or still be in progress (Africa/Lagos).",
                    },
                    message: "Check the highlighted event fields.",
                  });
                }}
                aria-invalid={Boolean(errors.startsAt)}
                aria-describedby={
                  errors.startsAt
                    ? "event-starts-at-error"
                    : undefined
                }
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30 aria-[invalid=true]:border-[#B54747]"
              />
              <FieldError
                id="event-starts-at"
                message={errors.startsAt}
              />
            </div>

            <div>
              <label
                htmlFor="event-ends-at"
                className="mb-2 block text-sm font-semibold text-[#344054]"
              >
                Ends (optional)
              </label>
              <input
                id="event-ends-at"
                name="endsAt"
                type="datetime-local"
                min={values.startsAt || undefined}
                value={values.endsAt}
                onChange={(change) =>
                  updateField("endsAt", change.currentTarget.value)
                }
                onInvalid={(invalidEvent) => {
                  if (
                    !invalidEvent.currentTarget.validity
                      .rangeUnderflow
                  )
                    return;
                  setClientValidation({
                    errors: {
                      endsAt: "The end must be after the start.",
                    },
                    message: "Check the highlighted event fields.",
                  });
                }}
                aria-invalid={Boolean(errors.endsAt)}
                aria-describedby={
                  errors.endsAt ? "event-ends-at-error" : undefined
                }
                className="min-h-11 w-full min-w-0 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30 aria-[invalid=true]:border-[#B54747]"
              />
              <FieldError
                id="event-ends-at"
                message={errors.endsAt}
              />
            </div>

            <div>
              <label
                htmlFor="event-location"
                className="mb-2 block text-sm font-semibold text-[#344054]"
              >
                Venue
              </label>
              <input
                id="event-location"
                name="location"
                type="text"
                required
                maxLength={300}
                value={values.location}
                onChange={(change) =>
                  updateField("location", change.currentTarget.value)
                }
                aria-invalid={Boolean(errors.location)}
                aria-describedby={
                  errors.location ? "event-location-error" : undefined
                }
                className="min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30 aria-[invalid=true]:border-[#B54747]"
              />
              <FieldError
                id="event-location"
                message={errors.location}
              />
            </div>

            {event ? (
              <div>
                <label
                  htmlFor="event-status"
                  className="mb-2 block text-sm font-semibold text-[#344054]"
                >
                  Status
                </label>
                <select
                  id="event-status"
                  name="status"
                  value={values.status}
                  onChange={(change) =>
                    updateField(
                      "status",
                      change.currentTarget.value as EventStatus,
                    )
                  }
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={
                    errors.status ? "event-status-error" : undefined
                  }
                  className="min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30 aria-[invalid=true]:border-[#B54747]"
                >
                  {EVENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="event-status"
                  message={errors.status}
                />
              </div>
            ) : (
              <input type="hidden" name="status" value="draft" />
            )}

            <div className="sm:col-span-2">
              <label
                htmlFor="event-description"
                className="mb-2 block text-sm font-semibold text-[#344054]"
              >
                Description
              </label>
              <textarea
                id="event-description"
                name="description"
                rows={5}
                maxLength={5000}
                value={values.description}
                onChange={(change) =>
                  updateField(
                    "description",
                    change.currentTarget.value,
                  )
                }
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description
                    ? "event-description-error"
                    : undefined
                }
                className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 py-3 text-sm leading-6 text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30 aria-[invalid=true]:border-[#B54747]"
              />
              <FieldError
                id="event-description"
                message={errors.description}
              />
            </div>
          </div>

          {children}

          <span className="sr-only" aria-live="polite">
            {pending ? "Saving event" : ""}
          </span>
          {!event && (
            <div className="mt-6 flex flex-col gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:justify-end">
              <Link
                href="/admin/events"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#475467] hover:bg-[#F8F9FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
              >
                Cancel
              </Link>
              <button
                type="submit"
                name="createIntent"
                value="draft"
                onClick={() => setCreateIntent("draft")}
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] hover:bg-[#F8F9FB] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
              >
                {pending ? "Saving…" : "Save Draft"}
              </button>
              <button
                type="submit"
                name="createIntent"
                value="published"
                onClick={() => setCreateIntent("published")}
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
              >
                {pending ? "Publishing…" : "Publish Event"}
              </button>
            </div>
          )}
        </section>
      </form>
      {event && (
        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:justify-end">
          <Link
            href="/admin/events"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#475467] hover:bg-[#F8F9FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form={formId}
            disabled={pending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
          >
            {pending ? "Saving…" : "Save Event"}
          </button>
        </div>
      )}
    </>
  );
}

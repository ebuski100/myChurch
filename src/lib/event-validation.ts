export const EVENT_STATUSES = [
  "draft",
  "published",
  "cancelled",
  "archived",
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventFormValues = {
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string;
  status: EventStatus;
};

export type EventFieldErrors = Partial<
  Record<keyof EventFormValues, string>
>;

export type EventValidationResult =
  | { ok: true; value: EventFormValues }
  | { ok: false; errors: EventFieldErrors };

export type EventValidationOptions = {
  now?: Date;
  preventPastPublication?: boolean;
};

const LAGOS_TIME_ZONE = "Africa/Lagos";

function readText(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function getLagosParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: LAGOS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
}

export function parseLagosDateTimeInput(
  value: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;

  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");
  const date = new Date(`${value}:00+01:00`);
  if (!Number.isFinite(date.getTime())) return null;

  const parts = getLagosParts(date);
  if (
    parts.year !== year ||
    parts.month !== month ||
    parts.day !== day ||
    parts.hour !== hour ||
    parts.minute !== minute
  ) {
    return null;
  }

  return date.toISOString();
}

export function formatLagosDateTimeInput(
  value: string | null,
): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  const parts = getLagosParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function validateEventForm(
  form: FormData,
  options: EventValidationOptions = {},
): EventValidationResult {
  const now = options.now ?? new Date();
  const title = readText(form, "title");
  const description = readText(form, "description");
  const startsAt = parseLagosDateTimeInput(
    readText(form, "startsAt"),
  );
  const endValue = readText(form, "endsAt");
  const endsAt = endValue ? parseLagosDateTimeInput(endValue) : null;
  const location = readText(form, "location");
  const rawStatus = form.get("status");
  const status =
    typeof rawStatus === "string" &&
    EVENT_STATUSES.includes(rawStatus as EventStatus)
      ? (rawStatus as EventStatus)
      : null;
  const errors: EventFieldErrors = {};

  if (!title) errors.title = "Enter an event title.";
  else if (title.length > 200)
    errors.title = "Use 200 characters or fewer.";
  if (description.length > 5000) {
    errors.description = "Use 5,000 characters or fewer.";
  }
  if (!startsAt)
    errors.startsAt =
      "Enter a valid start date and time in Africa/Lagos.";
  if (endValue && !endsAt) {
    errors.endsAt =
      "Enter a valid end date and time in Africa/Lagos.";
  } else if (
    startsAt &&
    endsAt &&
    Date.parse(endsAt) <= Date.parse(startsAt)
  ) {
    errors.endsAt = "The end must be after the start.";
  }
  if (
    options.preventPastPublication &&
    status === "published" &&
    startsAt &&
    Date.parse(startsAt) <= now.getTime() &&
    (!endsAt || Date.parse(endsAt) <= now.getTime())
  ) {
    errors.startsAt =
      "A completed event cannot be newly published. Choose a future start or an end time that is still in the future.";
  }
  if (!location) errors.location = "Enter an event venue.";
  else if (location.length > 300) {
    errors.location = "Use 300 characters or fewer.";
  }
  if (!status) errors.status = "Choose a valid event status.";

  if (Object.keys(errors).length || !startsAt || !status) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      title,
      description: description || null,
      startsAt,
      endsAt,
      location,
      status,
    },
  };
}

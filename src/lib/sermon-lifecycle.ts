export type SermonLifecycleStatus = "draft" | "scheduled" | "published" | "archived";
export type SermonLifecycleCommand = "publish" | "schedule" | "unpublish" | "cancel_schedule" | "archive" | "restore";

export type LifecycleFields = {
  publication_status: SermonLifecycleStatus;
  published_at: string | null;
};

export type ScheduleDateResult =
  | { ok: true; iso: string }
  | { ok: false; reason: "invalid" | "not_future" };

const LAGOS_TIME_ZONE = "Africa/Lagos";

function isDateTimeLocal(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function formatLagosParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: LAGOS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );
}

export function parseLagosScheduleDate(value: FormDataEntryValue | null, now = new Date()): ScheduleDateResult {
  if (typeof value !== "string" || !isDateTimeLocal(value)) return { ok: false, reason: "invalid" };

  // Africa/Lagos uses WAT (UTC+01:00); the datetime-local control is explicitly
  // labelled with this zone, so interpret its wall time with that offset.
  const scheduledAt = new Date(`${value}:00+01:00`);
  if (!Number.isFinite(scheduledAt.getTime())) return { ok: false, reason: "invalid" };
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");
  const parts = formatLagosParts(scheduledAt);
  if (
    parts.year !== year || parts.month !== month || parts.day !== day ||
    parts.hour !== hour || parts.minute !== minute
  ) return { ok: false, reason: "invalid" };
  if (scheduledAt.getTime() <= now.getTime()) return { ok: false, reason: "not_future" };

  return { ok: true, iso: scheduledAt.toISOString() };
}

export function canTransitionSermon(
  status: SermonLifecycleStatus,
  command: SermonLifecycleCommand,
): boolean {
  switch (command) {
    case "publish": return status === "draft";
    case "schedule": return status === "draft" || status === "scheduled";
    case "unpublish": return status === "published";
    case "cancel_schedule": return status === "scheduled";
    case "archive": return status !== "archived";
    case "restore": return status === "archived";
  }
}

export function sermonLifecycleFields(
  command: SermonLifecycleCommand,
  serverNow: string,
  scheduledAt?: string,
): LifecycleFields | null {
  switch (command) {
    case "publish":
      return { publication_status: "published", published_at: serverNow };
    case "schedule":
      return scheduledAt ? { publication_status: "scheduled", published_at: scheduledAt } : null;
    case "unpublish":
    case "cancel_schedule":
    case "restore":
      return { publication_status: "draft", published_at: null };
    case "archive":
      return { publication_status: "archived", published_at: null };
  }
}

export function formatScheduledDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: LAGOS_TIME_ZONE,
  }).format(date) + " WAT";
}

export function isLifecycleCommand(value: FormDataEntryValue | null): value is SermonLifecycleCommand {
  return typeof value === "string" && [
    "publish", "schedule", "unpublish", "cancel_schedule", "archive", "restore",
  ].includes(value);
}

export function summarizeBulkLifecycleResults(results: readonly { success: boolean }[]): {
  successes: number;
  total: number;
  message: string;
} {
  const successes = results.filter((result) => result.success).length;
  const total = results.length;
  return {
    successes,
    total,
    message: successes === total
      ? `Completed for all ${successes} selected sermon${successes === 1 ? "" : "s"}.`
      : `Completed for ${successes} of ${total} selected sermons. Review each result below.`,
  };
}

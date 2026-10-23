import { timingSafeEqual } from "node:crypto";
import type { SermonLifecycleStatus } from "@/lib/sermon-lifecycle";

export function isValidSchedulerAuthorization(header: string | null, expectedSecret: string | undefined): boolean {
  if (!expectedSecret || !header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice(7));
  const expected = Buffer.from(expectedSecret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function isDueScheduledSermon(status: unknown, scheduledAt: unknown, now: Date): boolean {
  if (status !== "scheduled" || typeof scheduledAt !== "string") return false;
  const timestamp = Date.parse(scheduledAt);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

export function schedulerClaimMatches(
  status: SermonLifecycleStatus,
  currentScheduledAt: string | null,
  expectedScheduledAt: string | null,
  now: Date,
): boolean {
  return status === "scheduled" &&
    currentScheduledAt !== null &&
    expectedScheduledAt === currentScheduledAt &&
    isDueScheduledSermon(status, currentScheduledAt, now);
}

import type { EventStatus } from "./event-validation";

type EventCreationStatus = Extract<
  EventStatus,
  "draft" | "published"
>;

export function getEventCreationDestination(
  status: EventCreationStatus,
): string {
  return `/admin/events?created=${status}`;
}

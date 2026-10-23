import test from "node:test";
import assert from "node:assert/strict";
import {
  formatLagosDateTimeInput,
  validateEventForm,
} from "./event-validation.ts";
import { getEventTimingStatus } from "./events.ts";

function eventForm(overrides = {}) {
  const form = new FormData();
  const values = {
    title: "  Ministry gathering  ",
    description: "  A public event.  ",
    startsAt: "2026-10-20T10:30",
    endsAt: "2026-10-20T12:00",
    location: " VictoryCity Hall ",
    status: "draft",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values))
    form.set(key, value);
  return form;
}

test("validates event details and converts Lagos wall times to UTC", () => {
  const result = validateEventForm(eventForm());

  assert.deepEqual(result, {
    ok: true,
    value: {
      title: "Ministry gathering",
      description: "A public event.",
      startsAt: "2026-10-20T09:30:00.000Z",
      endsAt: "2026-10-20T11:00:00.000Z",
      location: "VictoryCity Hall",
      status: "draft",
    },
  });
});

test("accepts published and cancelled statuses and an optional end time", () => {
  assert.equal(
    validateEventForm(eventForm({ status: "published", endsAt: "" }))
      .ok,
    true,
  );
  assert.equal(
    validateEventForm(eventForm({ status: "cancelled" })).ok,
    true,
  );
});

test("rejects publishing completed past events and today's elapsed start times", () => {
  const now = new Date("2026-10-17T10:00:00.000Z");
  const yesterday = validateEventForm(
    eventForm({
      startsAt: "2026-10-16T10:00",
      endsAt: "",
      status: "published",
    }),
    { now, preventPastPublication: true },
  );
  assert.equal(yesterday.ok, false);
  if (!yesterday.ok)
    assert.match(yesterday.errors.startsAt, /completed event/);

  const earlierToday = validateEventForm(
    eventForm({
      startsAt: "2026-10-17T10:30",
      endsAt: "",
      status: "published",
    }),
    { now, preventPastPublication: true },
  );
  assert.equal(earlierToday.ok, false);
  if (!earlierToday.ok)
    assert.match(earlierToday.errors.startsAt, /completed event/);
});

test("allows future publication and an ongoing multi-day event", () => {
  const now = new Date("2026-10-17T10:00:00.000Z");
  const future = validateEventForm(
    eventForm({
      startsAt: "2026-10-17T11:30",
      endsAt: "2026-10-17T13:00",
      status: "published",
    }),
    { now, preventPastPublication: true },
  );
  assert.equal(future.ok, true);

  const ongoing = validateEventForm(
    eventForm({
      startsAt: "2026-10-16T10:00",
      endsAt: "2026-10-18T12:00",
      status: "published",
    }),
    { now, preventPastPublication: true },
  );
  assert.equal(ongoing.ok, true);
  assert.equal(
    getEventTimingStatus(
      "2026-10-16T09:00:00.000Z",
      "2026-10-18T11:00:00.000Z",
      now,
    ),
    "ongoing",
  );
});

test("classifies future and completed events by their full time range", () => {
  const now = new Date("2026-10-17T10:00:00.000Z");
  assert.equal(
    getEventTimingStatus("2026-10-17T10:01:00.000Z", null, now),
    "upcoming",
  );
  assert.equal(
    getEventTimingStatus(
      "2026-10-16T10:00:00.000Z",
      "2026-10-17T09:59:00.000Z",
      now,
    ),
    "past",
  );
});

test("does not block drafts or edits to already-published historical events", () => {
  const now = new Date("2026-10-17T10:00:00.000Z");
  const pastDraft = validateEventForm(
    eventForm({
      startsAt: "2026-10-16T10:00",
      endsAt: "",
      status: "draft",
    }),
    { now, preventPastPublication: true },
  );
  assert.equal(pastDraft.ok, true);

  const historicalEdit = validateEventForm(
    eventForm({
      startsAt: "2026-10-16T10:00",
      endsAt: "",
      status: "published",
    }),
    { now, preventPastPublication: false },
  );
  assert.equal(historicalEdit.ok, true);
});

test("rejects invalid event dates and an end that is not after the start", () => {
  const invalidDate = validateEventForm(
    eventForm({ startsAt: "2026-02-30T10:30" }),
  );
  assert.equal(invalidDate.ok, false);
  if (!invalidDate.ok) assert.ok(invalidDate.errors.startsAt);

  const invalidEnd = validateEventForm(
    eventForm({ endsAt: "2026-10-20T10:30" }),
  );
  assert.equal(invalidEnd.ok, false);
  if (!invalidEnd.ok)
    assert.equal(
      invalidEnd.errors.endsAt,
      "The end must be after the start.",
    );
});

test("requires a title, venue, and supported status", () => {
  const result = validateEventForm(
    eventForm({ title: "", location: "", status: "scheduled" }),
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.title);
    assert.ok(result.errors.location);
    assert.ok(result.errors.status);
  }
});

test("formats stored event timestamps for Africa/Lagos inputs", () => {
  assert.equal(
    formatLagosDateTimeInput("2026-10-20T09:30:00.000Z"),
    "2026-10-20T10:30",
  );
  assert.equal(formatLagosDateTimeInput(null), "");
});

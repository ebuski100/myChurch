import assert from "node:assert/strict";
import test from "node:test";

const {
  canTransitionSermon,
  formatScheduledDate,
  isLifecycleCommand,
  parseLagosScheduleDate,
  sermonLifecycleFields,
  summarizeBulkLifecycleResults,
} = await import(new URL("./sermon-lifecycle.ts", import.meta.url).href);

test("validates future schedule times as Africa/Lagos wall-clock values", () => {
  const now = new Date("2026-10-17T09:00:00.000Z");
  assert.deepEqual(parseLagosScheduleDate("2026-10-17T11:00", now), {
    ok: true,
    iso: "2026-10-17T10:00:00.000Z",
  });
  assert.deepEqual(parseLagosScheduleDate("2026-02-30T11:00", now), { ok: false, reason: "invalid" });
  assert.deepEqual(parseLagosScheduleDate("2026-10-17T09:00", now), { ok: false, reason: "not_future" });
  assert.deepEqual(parseLagosScheduleDate("not-a-date", now), { ok: false, reason: "invalid" });
});

test("enforces explicit lifecycle transitions", () => {
  assert.equal(canTransitionSermon("draft", "publish"), true);
  assert.equal(canTransitionSermon("draft", "schedule"), true);
  assert.equal(canTransitionSermon("scheduled", "schedule"), true);
  assert.equal(canTransitionSermon("scheduled", "cancel_schedule"), true);
  assert.equal(canTransitionSermon("published", "archive"), true);
  assert.equal(canTransitionSermon("draft", "archive"), true);
  assert.equal(canTransitionSermon("archived", "restore"), true);
  assert.equal(canTransitionSermon("archived", "publish"), false);
  assert.equal(canTransitionSermon("published", "publish"), false);
});

test("sets publication fields consistently and returns restored sermons to drafts", () => {
  const now = "2026-10-17T10:00:00.000Z";
  assert.deepEqual(sermonLifecycleFields("publish", now), { publication_status: "published", published_at: now });
  assert.deepEqual(sermonLifecycleFields("schedule", now, "2026-10-18T10:00:00.000Z"), {
    publication_status: "scheduled",
    published_at: "2026-10-18T10:00:00.000Z",
  });
  assert.deepEqual(sermonLifecycleFields("cancel_schedule", now), { publication_status: "draft", published_at: null });
  assert.deepEqual(sermonLifecycleFields("archive", now), { publication_status: "archived", published_at: null });
  assert.deepEqual(sermonLifecycleFields("restore", now), { publication_status: "draft", published_at: null });
  assert.equal(sermonLifecycleFields("schedule", now), null);
});

test("accepts only known lifecycle commands and formats scheduled times in WAT", () => {
  assert.equal(isLifecycleCommand("archive"), true);
  assert.equal(isLifecycleCommand("delete"), false);
  assert.equal(formatScheduledDate("2026-10-17T10:00:00.000Z"), "Oct 17, 2026, 11:00 AM WAT");
  assert.equal(formatScheduledDate(null), null);
});

test("bulk result summaries report partial failures instead of claiming total success", () => {
  assert.deepEqual(summarizeBulkLifecycleResults([{ success: true }, { success: false }, { success: false }]), {
    successes: 1,
    total: 3,
    message: "Completed for 1 of 3 selected sermons. Review each result below.",
  });
});

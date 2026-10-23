import assert from "node:assert/strict";
import test from "node:test";

const { isDueScheduledSermon, isValidSchedulerAuthorization, schedulerClaimMatches } = await import(new URL("./sermon-scheduler.ts", import.meta.url).href);

test("accepts only the configured scheduler bearer token", () => {
  assert.equal(isValidSchedulerAuthorization("Bearer a-long-secret", "a-long-secret"), true);
  assert.equal(isValidSchedulerAuthorization("Bearer wrong", "a-long-secret"), false);
  assert.equal(isValidSchedulerAuthorization(null, "a-long-secret"), false);
  assert.equal(isValidSchedulerAuthorization("Bearer a-long-secret", undefined), false);
});

test("only due records with the explicit scheduled status are candidates", () => {
  const now = new Date("2026-10-17T10:00:00.000Z");
  assert.equal(isDueScheduledSermon("scheduled", "2026-10-17T09:59:00.000Z", now), true);
  assert.equal(isDueScheduledSermon("scheduled", "2026-10-17T10:01:00.000Z", now), false);
  assert.equal(isDueScheduledSermon("published", "2026-10-17T09:00:00.000Z", now), false);
  assert.equal(isDueScheduledSermon("scheduled", "invalid", now), false);
});

test("scheduler claim requires an unchanged due scheduled state", () => {
  const now = new Date("2026-10-17T10:00:00.000Z");
  const due = "2026-10-17T09:00:00.000Z";
  assert.equal(schedulerClaimMatches("scheduled", due, due, now), true);
  assert.equal(schedulerClaimMatches("published", due, due, now), false);
  assert.equal(schedulerClaimMatches("scheduled", "2026-10-17T09:30:00.000Z", due, now), false);
  assert.equal(schedulerClaimMatches("scheduled", "2026-10-17T10:30:00.000Z", "2026-10-17T10:30:00.000Z", now), false);
});

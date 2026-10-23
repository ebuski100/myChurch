import test from "node:test";
import assert from "node:assert/strict";
import { getEventCreationDestination } from "./event-creation-flow.ts";

test("new draft and published events return to the event list with status notices", () => {
  assert.equal(
    getEventCreationDestination("draft"),
    "/admin/events?created=draft",
  );
  assert.equal(
    getEventCreationDestination("published"),
    "/admin/events?created=published",
  );
});

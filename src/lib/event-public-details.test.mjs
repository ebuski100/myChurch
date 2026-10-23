import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEventCalendarFile,
  buildEventDirectionsUrl,
} from "./event-public-details.ts";

const event = {
  id: "41000000-0000-0000-0000-000000000001",
  title: "Grace; Hope, and Faith",
  description: "Bring a friend.\nAll are welcome.",
  startsAt: "2026-10-20T09:30:00.000Z",
  endsAt: "2026-10-20T11:00:00.000Z",
  location: "VictoryCity Hall, Coal Camp",
};

test("creates a UTC calendar file with escaped text and exact event times", () => {
  const calendar = buildEventCalendarFile(
    event,
    new Date("2026-10-17T10:00:00.000Z"),
  );

  assert.match(calendar, /DTSTART:20261020T093000Z/);
  assert.match(calendar, /DTEND:20261020T110000Z/);
  assert.match(calendar, /SUMMARY:Grace\\; Hope\\, and Faith/);
  assert.ok(
    calendar.includes(
      "DESCRIPTION:Bring a friend.\\nAll are welcome.",
    ),
  );
  assert.match(calendar, /LOCATION:VictoryCity Hall\\, Coal Camp/);
  assert.match(calendar, /DTSTAMP:20261017T100000Z/);
});

test("does not invent an end time for events without one", () => {
  const calendar = buildEventCalendarFile({ ...event, endsAt: null });
  assert.doesNotMatch(calendar, /DTEND:/);
});

test("folds long calendar lines without exceeding 75 UTF-8 octets", () => {
  const calendar = buildEventCalendarFile({
    ...event,
    description: "Worship " + "é".repeat(100),
  });
  for (const line of calendar.split("\r\n")) {
    assert.ok(new TextEncoder().encode(line).length <= 75, line);
  }
});

test("creates directions links only for usable location text", () => {
  assert.equal(
    buildEventDirectionsUrl("VictoryCity Hall, Coal Camp"),
    "https://www.google.com/maps/search/?api=1&query=VictoryCity%20Hall%2C%20Coal%20Camp",
  );
  assert.equal(buildEventDirectionsUrl(null), null);
  assert.equal(buildEventDirectionsUrl("  \n "), null);
  assert.equal(buildEventDirectionsUrl("Venue\u0000Name"), null);
  assert.equal(buildEventDirectionsUrl("Online"), null);
  assert.equal(buildEventDirectionsUrl("To be announced"), null);
});

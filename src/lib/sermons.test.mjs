import assert from "node:assert/strict";
import test from "node:test";

const { formatDuration } = await import(new URL("./sermons.ts", import.meta.url).href);

test("formats durations as readable minutes and hours", () => {
  assert.equal(formatDuration(30 * 60), "30 min");
  assert.equal(formatDuration(45 * 60), "45 min");
  assert.equal(formatDuration(80 * 60), "1 hr 20 min");
  assert.equal(formatDuration(90 * 60), "1 hr 30 min");
  assert.equal(formatDuration((2 * 60 + 8) * 60), "2 hr 8 min");
  assert.equal(formatDuration(2 * 60 * 60), "2 hr");
});

test("formats short durations and ignores invalid values", () => {
  assert.equal(formatDuration(30), "30 sec");
  assert.equal(formatDuration(null), null);
  assert.equal(formatDuration(0), null);
  assert.equal(formatDuration(-10), null);
});

import assert from "node:assert/strict";
import test from "node:test";

const { normalizeDetectedAudioDuration, parseUploadedAudioDuration } = await import(new URL("./sermon-audio-duration.ts", import.meta.url).href);

test("normalizes finite browser metadata to positive whole seconds", () => {
  assert.equal(normalizeDetectedAudioDuration(42 * 60 + 0.4), 2520);
  assert.equal(normalizeDetectedAudioDuration(42 * 60 + 0.6), 2521);
  assert.equal(normalizeDetectedAudioDuration(0), null);
  assert.equal(normalizeDetectedAudioDuration(-1), null);
  assert.equal(normalizeDetectedAudioDuration(Number.NaN), null);
  assert.equal(normalizeDetectedAudioDuration(Number.POSITIVE_INFINITY), null);
  assert.equal(normalizeDetectedAudioDuration(2_147_483_648), null);
});

test("accepts only strict, in-range integer duration values from the upload request", () => {
  assert.equal(parseUploadedAudioDuration("2520"), 2520);
  assert.equal(parseUploadedAudioDuration("0"), null);
  assert.equal(parseUploadedAudioDuration("-1"), null);
  assert.equal(parseUploadedAudioDuration("1.5"), null);
  assert.equal(parseUploadedAudioDuration("Infinity"), null);
  assert.equal(parseUploadedAudioDuration("2147483648"), null);
  assert.equal(parseUploadedAudioDuration(null), null);
});

test("missing or invalid detection produces no duration update, preserving a prior value on replacement", () => {
  // The upload route updates audio_details only when this parser returns a duration.
  assert.equal(parseUploadedAudioDuration(null), null);
  assert.equal(parseUploadedAudioDuration("NaN"), null);
});

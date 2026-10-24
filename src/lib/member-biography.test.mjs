import test from "node:test";
import assert from "node:assert/strict";
import {
  MEMBER_BIOGRAPHY_PREVIEW_LENGTH,
  truncateBiography,
} from "./member-biography.ts";

test("returns null for missing or blank biographies", () => {
  assert.equal(truncateBiography(null), null);
  assert.equal(truncateBiography("   \n  "), null);
});

test("returns short biographies unchanged", () => {
  assert.equal(truncateBiography("Serves the choir."), "Serves the choir.");
});

test("truncates long biographies at a word boundary with an ellipsis", () => {
  const long =
    "Mmesoma leads the choir with joy and dedication every single Sunday morning service without fail, welcoming every newcomer with warmth and grace from the very first visit onward.";
  const preview = truncateBiography(long);
  assert.ok(preview);
  if (!preview) return;
  assert.ok(preview.endsWith("..."));
  assert.ok(preview.length <= MEMBER_BIOGRAPHY_PREVIEW_LENGTH + 3);
  // No word is cut in half: the preview text is a prefix of the source
  // that ends at a word boundary.
  const withoutEllipsis = preview.slice(0, -3);
  assert.equal(long.startsWith(withoutEllipsis), true);
  const nextChar = long[withoutEllipsis.length];
  assert.ok(nextChar === " " || nextChar === undefined);
});

test("respects a custom length limit", () => {
  const preview = truncateBiography("Alpha beta gamma delta", 10);
  assert.equal(preview, "Alpha...");
});

test("collapses internal whitespace before truncating", () => {
  const preview = truncateBiography("Line one\n  line two   line three", 20);
  assert.equal(preview, "Line one line two...");
});

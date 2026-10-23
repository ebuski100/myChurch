import assert from "node:assert/strict";
import test from "node:test";

const { parseDownloadAllowedValue } = await import(
  new URL("./sermon-download-setting-validation.ts", import.meta.url).href
);

test("accepts only the exact boolean form values", () => {
  assert.equal(parseDownloadAllowedValue("true"), true);
  assert.equal(parseDownloadAllowedValue("false"), false);
});

test("rejects missing, non-string, and truthy-looking values", () => {
  assert.equal(parseDownloadAllowedValue(null), null);
  assert.equal(parseDownloadAllowedValue("on"), null);
  assert.equal(parseDownloadAllowedValue("1"), null);
  assert.equal(parseDownloadAllowedValue("yes"), null);
  assert.equal(parseDownloadAllowedValue("TRUE"), null);
  assert.equal(parseDownloadAllowedValue(new File(["true"], "value.txt")), null);
});

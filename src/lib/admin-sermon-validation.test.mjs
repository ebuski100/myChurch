import assert from "node:assert/strict";
import test from "node:test";

const { validateSermonForm } = await import(new URL("./admin-sermon-validation.ts", import.meta.url).href);

function form(fields) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

test("requires a non-empty title", () => {
  assert.deepEqual(validateSermonForm(form({ title: "   " })), {
    ok: false,
    errors: { title: "Enter a sermon title." },
  });
});

test("normalizes optional sermon metadata without accepting a manual duration", () => {
  assert.deepEqual(validateSermonForm(form({
    title: "  A Sermon  ", description: "  Notes ", preacher: "", sermonDate: "2026-10-16", series: "  Series ", durationSeconds: "999999",
  })), {
    ok: true,
    value: { title: "A Sermon", description: "Notes", preacher: null, sermonDate: "2026-10-16", series: "Series" },
  });
});

test("rejects invalid sermon dates", () => {
  const result = validateSermonForm(form({ title: "Sermon", sermonDate: "2026-02-30" }));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.sermonDate);
  }
});

test("enforces metadata input lengths", () => {
  const result = validateSermonForm(form({ title: "x".repeat(201), preacher: "x".repeat(201) }));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.title);
    assert.ok(result.errors.preacher);
  }
});

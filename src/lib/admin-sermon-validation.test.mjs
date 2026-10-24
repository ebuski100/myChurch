import test from "node:test";
import assert from "node:assert/strict";
import { validateSermonForm } from "./admin-sermon-validation.ts";

function form(overrides = {}) {
  const data = new FormData();
  const values = {
    title: " Sunday Grace ",
    description: "",
    preacher: "Pastor Nelson",
    sermonDate: "2026-10-26",
    series: "Grace",
    mediaType: "audio",
    youtubeUrl: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

test("audio sermons validate without a YouTube URL", () => {
  const result = validateSermonForm(form());
  assert.deepEqual(result, {
    ok: true,
    value: {
      title: "Sunday Grace",
      description: null,
      preacher: "Pastor Nelson",
      sermonDate: "2026-10-26",
      series: "Grace",
      mediaType: "audio",
      youtubeUrl: null,
    },
  });
});

test("video sermons require a YouTube URL and keep it verbatim", () => {
  const result = validateSermonForm(
    form({
      mediaType: "video",
      youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
    }),
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.mediaType, "video");
    assert.equal(
      result.value.youtubeUrl,
      "https://youtu.be/dQw4w9WgXcQ",
    );
  }
});

test("video sermons reject iframe HTML and non-YouTube input", () => {
  const injected = validateSermonForm(
    form({
      mediaType: "video",
      youtubeUrl: `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>`,
    }),
  );
  assert.equal(injected.ok, false);
  if (!injected.ok) assert.ok(injected.errors.youtubeUrl);
});

test("missing media type and locked-type changes are rejected", () => {
  const missing = validateSermonForm(
    form({ mediaType: "", youtubeUrl: "" }),
  );
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.ok(missing.errors.mediaType);

  const changed = validateSermonForm(
    form({ mediaType: "video", youtubeUrl: "https://youtu.be/dQw4w9WgXcQ" }),
    "audio",
  );
  assert.equal(changed.ok, false);
  if (!changed.ok) assert.ok(changed.errors.mediaType);
});

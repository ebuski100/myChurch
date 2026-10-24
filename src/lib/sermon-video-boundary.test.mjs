import assert from "node:assert/strict";
import test from "node:test";

const { authorizeSermonAudio } = await import(
  new URL("./sermon-audio-authorization.ts", import.meta.url).href
);
const { checkSermonReadyToPublish } = await import(
  new URL("./sermon-publication.ts", import.meta.url).href
);

test("audio authorization rejects video resources", () => {
  const resourceId = "81000000-0000-4000-8000-000000000001";
  const row = {
    id: resourceId,
    resource_type: "video",
    publication_status: "published",
    published_at: new Date().toISOString(),
    sermon_details: [{ resource_id: resourceId }],
    audio_details: [],
    resource_assets: [],
  };
  assert.deepEqual(authorizeSermonAudio(row, resourceId, "playback"), {
    ok: false,
    reason: "invalid_resource",
  });
  assert.deepEqual(authorizeSermonAudio(row, resourceId, "download"), {
    ok: false,
    reason: "invalid_resource",
  });
});

test("audio publication validation remains audio-specific", () => {
  const resourceId = "81000000-0000-4000-8000-000000000002";
  assert.deepEqual(
    checkSermonReadyToPublish(
      {
        id: resourceId,
        title: "Video message",
        resource_type: "video",
        sermon_details: [{ resource_id: resourceId }],
        audio_details: [],
        resource_assets: [],
      },
      resourceId,
    ),
    { ok: false, reason: "not_audio" },
  );
});

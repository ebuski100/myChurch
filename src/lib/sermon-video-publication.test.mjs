import assert from "node:assert/strict";
import test from "node:test";

const { checkVideoSermonReadyToPublish } = await import(
  new URL("./sermon-video-publication.ts", import.meta.url).href
);

const VIDEO_ID = "dQw4w9WgXcQ";
const RESOURCE_ID = "11111111-1111-4111-8111-111111111111";

function videoRow(overrides = {}) {
  return {
    id: RESOURCE_ID,
    title: "Sunday Message",
    resource_type: "video",
    sermon_details: [{ resource_id: RESOURCE_ID }],
    video_details: [
      {
        resource_id: RESOURCE_ID,
        external_url: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
      },
    ],
    ...overrides,
  };
}

test("video publication validation stays video-specific", () => {
  const valid = checkVideoSermonReadyToPublish(videoRow(), RESOURCE_ID);
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.videoId, VIDEO_ID);
    assert.equal(valid.externalUrl, `https://www.youtube.com/watch?v=${VIDEO_ID}`);
  }

  assert.deepEqual(
    checkVideoSermonReadyToPublish(videoRow({ resource_type: "audio" }), RESOURCE_ID),
    { ok: false, reason: "not_video" },
  );
});

test("incomplete video records remain unpublished", () => {
  assert.equal(
    checkVideoSermonReadyToPublish(null, RESOURCE_ID).ok,
    false,
  );
  assert.deepEqual(
    checkVideoSermonReadyToPublish(videoRow({ title: "  " }), RESOURCE_ID),
    { ok: false, reason: "missing_title" },
  );
  assert.deepEqual(
    checkVideoSermonReadyToPublish(videoRow({ sermon_details: [] }), RESOURCE_ID),
    { ok: false, reason: "missing_sermon_details" },
  );
  assert.deepEqual(
    checkVideoSermonReadyToPublish(videoRow({ video_details: [] }), RESOURCE_ID),
    { ok: false, reason: "missing_video_details" },
  );
  assert.deepEqual(
    checkVideoSermonReadyToPublish(
      videoRow({ video_details: [{ resource_id: RESOURCE_ID }] }),
      RESOURCE_ID,
    ),
    { ok: false, reason: "missing_video_url" },
  );
  assert.deepEqual(
    checkVideoSermonReadyToPublish(
      videoRow({
        video_details: [
          { resource_id: RESOURCE_ID, external_url: "https://evil.example/video" },
        ],
      }),
      RESOURCE_ID,
    ),
    { ok: false, reason: "invalid_video_url" },
  );
});

test("canonical stored URL is regenerated, not echoed", () => {
  const result = checkVideoSermonReadyToPublish(
    videoRow({
      video_details: [
        {
          resource_id: RESOURCE_ID,
          external_url: `https://youtu.be/${VIDEO_ID}?t=42`,
        },
      ],
    }),
    RESOURCE_ID,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.externalUrl, `https://www.youtube.com/watch?v=${VIDEO_ID}`);
  }
});

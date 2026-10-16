import assert from "node:assert/strict";
import test from "node:test";

const {
  authorizeSermonAudio,
  isValidAudioObjectPath,
  isUuid,
} = await import(new URL("./sermon-audio-authorization.ts", import.meta.url).href);

const resourceId = "71000000-0000-4000-8000-000000000001";
const now = new Date("2026-10-15T12:00:00.000Z");

function eligibleRow(overrides = {}) {
  return {
    id: resourceId,
    resource_type: "audio",
    publication_status: "published",
    published_at: "2026-10-15T11:00:00.000Z",
    sermon_details: [{ resource_id: resourceId }],
    audio_details: [{ resource_id: resourceId }],
    resource_assets: [{
      purpose: "audio",
      download_allowed: true,
      assets: [{
        storage_bucket: "sermon-audio",
        object_path: `${resourceId}/recording.mp3`,
        media_type: "audio",
        mime_type: "audio/mpeg",
        original_filename: "recording.mp3",
      }],
    }],
    ...overrides,
  };
}

test("allows playback for a published linked audio sermon", () => {
  const result = authorizeSermonAudio(eligibleRow(), resourceId, "playback", now);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.audio.objectPath, `${resourceId}/recording.mp3`);
});

test("allows official downloads only when the linked asset allows them", () => {
  const allowed = authorizeSermonAudio(eligibleRow(), resourceId, "download", now);
  assert.equal(allowed.ok, true);

  const denied = authorizeSermonAudio(eligibleRow({
    resource_assets: [{
      purpose: "audio",
      download_allowed: false,
      assets: [{
        storage_bucket: "sermon-audio",
        object_path: `${resourceId}/recording.mp3`,
        media_type: "audio",
        mime_type: "audio/mpeg",
      }],
    }],
  }), resourceId, "download", now);
  assert.deepEqual(denied, { ok: false, reason: "download_not_allowed" });
});

test("rejects resources that are missing, mismatched, unpublished, or scheduled", () => {
  assert.equal(authorizeSermonAudio(null, resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({ id: "other" }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({ resource_type: "video" }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({ publication_status: "draft" }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({ publication_status: "archived" }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({ published_at: "2026-10-16T00:00:00.000Z" }), resourceId, "playback", now).ok, false);
});

test("rejects missing details, unlinked assets, wrong buckets, and invalid paths", () => {
  assert.equal(authorizeSermonAudio(eligibleRow({ sermon_details: [] }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({ audio_details: [] }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({ sermon_details: [{ resource_id: "other" }] }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({ resource_assets: [] }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({
    resource_assets: [{ purpose: "cover", download_allowed: true, assets: [] }],
  }), resourceId, "playback", now).ok, false);
  assert.equal(authorizeSermonAudio(eligibleRow({
    resource_assets: [{
      purpose: "audio",
      download_allowed: true,
      assets: [{ storage_bucket: "other", object_path: "recording.mp3", media_type: "audio", mime_type: "audio/mpeg" }],
    }],
  }), resourceId, "playback", now).ok, false);
  assert.equal(isValidAudioObjectPath("../private.mp3"), false);
  assert.equal(isValidAudioObjectPath("/absolute.mp3"), false);
});

test("validates route resource identifiers", () => {
  assert.equal(isUuid(resourceId), true);
  assert.equal(isUuid("not-a-resource-id"), false);
});

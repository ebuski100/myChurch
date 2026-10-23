import assert from "node:assert/strict";
import test from "node:test";

const {
  checkSermonReadyToPublish,
  canChangePublication,
  isValidPrivateSermonAudioAsset,
  parsePublicationInput,
  publicationFields,
} = await import(new URL("./sermon-publication.ts", import.meta.url).href);
const { authorizeSermonAudio } = await import(new URL("./sermon-audio-authorization.ts", import.meta.url).href);

const resourceId = "71000000-0000-4000-8000-000000000001";
const assetId = "72000000-0000-4000-8000-000000000001";

function publishableRow(overrides = {}) {
  return {
    id: resourceId,
    title: "Local publication test sermon",
    resource_type: "audio",
    sermon_details: [{ resource_id: resourceId }],
    audio_details: [{ resource_id: resourceId }],
    resource_assets: [{
      purpose: "audio",
      asset_id: assetId,
      assets: [{ id: assetId, media_type: "audio" }],
    }],
    ...overrides,
  };
}

test("requires a matching audio resource, title, sermon/audio details, and linked audio asset", () => {
  assert.deepEqual(checkSermonReadyToPublish(publishableRow(), resourceId), {
    ok: true,
    audioAssetIds: [assetId],
  });
  assert.equal(checkSermonReadyToPublish(null, resourceId).ok, false);
  assert.equal(checkSermonReadyToPublish(publishableRow({ resource_type: "video" }), resourceId).ok, false);
  assert.equal(checkSermonReadyToPublish(publishableRow({ title: "   " }), resourceId).ok, false);
  assert.equal(checkSermonReadyToPublish(publishableRow({ sermon_details: [] }), resourceId).ok, false);
  assert.equal(checkSermonReadyToPublish(publishableRow({ audio_details: [] }), resourceId).ok, false);
  assert.equal(checkSermonReadyToPublish(publishableRow({ resource_assets: [] }), resourceId).ok, false);
  assert.equal(checkSermonReadyToPublish(publishableRow({ id: "other" }), resourceId).ok, false);
  assert.equal(checkSermonReadyToPublish(publishableRow({ resource_assets: [{
    purpose: "cover", asset_id: assetId, assets: [{ id: assetId, media_type: "audio" }],
  }] }), resourceId).ok, false);
  assert.equal(checkSermonReadyToPublish(publishableRow({ resource_assets: [{
    purpose: "audio", asset_id: assetId, assets: [{ id: "different", media_type: "audio" }],
  }] }), resourceId).ok, false);
});

test("requires a private bucket locator and MIME type allowed for sermon audio", () => {
  const valid = {
    id: assetId,
    storage_bucket: "sermon-audio",
    object_path: `${resourceId}/random-recording.mp3`,
    media_type: "audio",
    mime_type: "audio/mpeg",
  };
  assert.equal(isValidPrivateSermonAudioAsset(valid), true);
  assert.equal(isValidPrivateSermonAudioAsset({ ...valid, storage_bucket: "public" }), false);
  assert.equal(isValidPrivateSermonAudioAsset({ ...valid, object_path: "../audio.mp3" }), false);
  assert.equal(isValidPrivateSermonAudioAsset({ ...valid, mime_type: "audio/x-unknown" }), false);
});

test("accepts only confirmed publish or unpublish commands", () => {
  assert.deepEqual(parsePublicationInput("publish", "yes"), { command: "publish", confirmed: true });
  assert.deepEqual(parsePublicationInput("unpublish", "yes"), { command: "unpublish", confirmed: true });
  assert.equal(parsePublicationInput("publish", null), null);
  assert.equal(parsePublicationInput("delete", "yes"), null);
  assert.equal(parsePublicationInput("publish", "on"), null);
});

test("publishing stamps server time and unpublishing returns the sermon to draft", () => {
  assert.deepEqual(publicationFields("publish", "2026-10-16T12:00:00.000Z"), {
    publication_status: "published",
    published_at: "2026-10-16T12:00:00.000Z",
  });
  assert.deepEqual(publicationFields("unpublish", "2026-10-16T12:00:00.000Z"), {
    publication_status: "draft",
    published_at: null,
  });
  assert.equal(canChangePublication("publish", "draft"), true);
  assert.equal(canChangePublication("publish", "archived"), false);
  assert.equal(canChangePublication("publish", "scheduled"), false);
  assert.equal(canChangePublication("publish", "published"), false);
  assert.equal(canChangePublication("unpublish", "published"), true);
  assert.equal(canChangePublication("unpublish", "draft"), false);
});

test("unpublishing blocks subsequent public playback and downloads", () => {
  const unpublished = publicationFields("unpublish", "2026-10-16T12:00:00.000Z");
  const row = {
    id: resourceId,
    resource_type: "audio",
    published_at: "2026-10-15T12:00:00.000Z",
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
      }],
    }],
    ...unpublished,
  };
  assert.equal(authorizeSermonAudio(row, resourceId, "playback").ok, false);
  assert.equal(authorizeSermonAudio(row, resourceId, "download").ok, false);
});

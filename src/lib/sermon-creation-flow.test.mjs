import assert from "node:assert/strict";
import test from "node:test";

const { getSermonCreationDestination, getSermonCreationStep } = await import(new URL("./sermon-creation-flow.ts", import.meta.url).href);

test("saving metadata without audio creates a recoverable draft", () => {
  assert.equal(getSermonCreationStep({
    intent: "draft",
    resourceId: null,
    fileSelected: false,
    audioAttached: false,
    downloadSettingSaved: false,
  }), "create_draft");
  assert.equal(getSermonCreationStep({
    intent: "draft",
    resourceId: "saved-draft-id",
    fileSelected: false,
    audioAttached: false,
    downloadSettingSaved: false,
  }), "draft_saved");
});

test("an upload failure can be retried on the saved draft without creating another resource", () => {
  const resourceId = "saved-draft-id";
  assert.equal(getSermonCreationStep({ intent: "draft", resourceId: null, fileSelected: true, audioAttached: false, downloadSettingSaved: false }), "create_draft");
  assert.equal(getSermonCreationStep({ intent: "draft", resourceId, fileSelected: true, audioAttached: false, downloadSettingSaved: false }), "upload_audio");
  // The server keeps resourceId after an upload error, so the next submission retries the upload step.
  assert.equal(getSermonCreationStep({ intent: "draft", resourceId, fileSelected: true, audioAttached: false, downloadSettingSaved: false }), "upload_audio");
});

test("publishing requires audio, uploads before publication, and draft intent never publishes", () => {
  assert.equal(getSermonCreationStep({ intent: "publish", resourceId: null, fileSelected: false, audioAttached: false, downloadSettingSaved: false }), "missing_audio");
  assert.equal(getSermonCreationStep({ intent: "publish", resourceId: null, fileSelected: true, audioAttached: false, downloadSettingSaved: false }), "create_draft");
  assert.equal(getSermonCreationStep({ intent: "publish", resourceId: "saved-draft-id", fileSelected: true, audioAttached: false, downloadSettingSaved: false }), "upload_audio");
  assert.equal(getSermonCreationStep({ intent: "publish", resourceId: "saved-draft-id", fileSelected: false, audioAttached: true, downloadSettingSaved: false }), "save_download_permission");
  assert.equal(getSermonCreationStep({ intent: "draft", resourceId: "saved-draft-id", fileSelected: false, audioAttached: true, downloadSettingSaved: false }), "save_download_permission");
  assert.equal(getSermonCreationStep({ intent: "publish", resourceId: "saved-draft-id", fileSelected: false, audioAttached: true, downloadSettingSaved: true }), "publish");
  assert.equal(getSermonCreationStep({ intent: "draft", resourceId: "saved-draft-id", fileSelected: false, audioAttached: true, downloadSettingSaved: true }), "draft_saved");
});

test("scheduling requires audio and completes as a separate lifecycle intent", () => {
  assert.equal(getSermonCreationStep({ intent: "schedule", resourceId: null, fileSelected: false, audioAttached: false, downloadSettingSaved: false }), "missing_audio");
  assert.equal(getSermonCreationStep({ intent: "schedule", resourceId: null, fileSelected: true, audioAttached: false, downloadSettingSaved: false }), "create_draft");
  assert.equal(getSermonCreationStep({ intent: "schedule", resourceId: "saved-draft-id", fileSelected: true, audioAttached: false, downloadSettingSaved: false }), "upload_audio");
  assert.equal(getSermonCreationStep({ intent: "schedule", resourceId: "saved-draft-id", fileSelected: false, audioAttached: true, downloadSettingSaved: true }), "schedule");
});

test("draft and publish completion navigate to separate sermon-list notices", () => {
  assert.equal(getSermonCreationDestination("draft"), "/admin/sermons?created=1");
  assert.equal(getSermonCreationDestination("publish"), "/admin/sermons?published=1");
  assert.equal(getSermonCreationDestination("schedule"), "/admin/sermons?scheduled=1");
  assert.equal(getSermonCreationDestination("draft", true), "/admin/sermons?created=1&durationWarning=1");
  assert.equal(getSermonCreationDestination("publish", true), "/admin/sermons?published=1&durationWarning=1");
});

test("a failed permission save keeps publication gated until a retry succeeds", () => {
  const input = { intent: "publish", resourceId: "saved-draft-id", fileSelected: false, audioAttached: true };
  assert.equal(getSermonCreationStep({ ...input, downloadSettingSaved: false }), "save_download_permission");
  // A subsequent successful authorized setting update advances to publication.
  assert.equal(getSermonCreationStep({ ...input, downloadSettingSaved: true }), "publish");
});

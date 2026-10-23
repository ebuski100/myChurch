import assert from "node:assert/strict";
import test from "node:test";

const { SERMON_AUDIO_BUCKET_LIMIT_BYTES, validateSermonAudioUpload } = await import(
  new URL("./sermon-audio-upload-validation.ts", import.meta.url).href
);

test("accepts supported audio signatures and derives the stored MIME type", () => {
  const examples = [
    ["sermon.mp3", [0x49, 0x44, 0x33], "audio/mpeg"],
    ["sermon.m4a", [0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70], "audio/mp4"],
    ["sermon.aac", [0xff, 0xf1], "audio/aac"],
    ["sermon.ogg", [0x4f, 0x67, 0x67, 0x53], "audio/ogg"],
    ["sermon.wav", [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45], "audio/wav"],
    ["sermon.webm", [0x1a, 0x45, 0xdf, 0xa3], "audio/webm"],
    ["sermon.flac", [0x66, 0x4c, 0x61, 0x43], "audio/flac"],
  ];

  for (const [filename, bytes, mimeType] of examples) {
    assert.deepEqual(validateSermonAudioUpload(filename, 12, Uint8Array.from(bytes)), {
      ok: true,
      extension: `.${filename.split(".").pop()}`,
      mimeType,
    });
  }
});

test("rejects empty, oversized, and invalid file sizes", () => {
  const signature = Uint8Array.from([0x49, 0x44, 0x33]);
  assert.equal(validateSermonAudioUpload("sermon.mp3", 0, signature).ok, false);
  assert.equal(validateSermonAudioUpload("sermon.mp3", SERMON_AUDIO_BUCKET_LIMIT_BYTES + 1, signature).ok, false);
  assert.equal(validateSermonAudioUpload("sermon.mp3", Number.NaN, signature).ok, false);
});

test("does not trust a supported extension or browser MIME claim without a matching signature", () => {
  assert.deepEqual(validateSermonAudioUpload("not-audio.mp3", 100, Uint8Array.from([0, 1, 2])), {
    ok: false,
    reason: "invalid_signature",
  });
  assert.deepEqual(validateSermonAudioUpload("sermon.exe", 100, Uint8Array.from([0x49, 0x44, 0x33])), {
    ok: false,
    reason: "unsupported_format",
  });
});

test("rejects filenames containing path separators or control characters", () => {
  assert.equal(validateSermonAudioUpload("../sermon.mp3", 12, Uint8Array.from([0x49, 0x44, 0x33])).ok, false);
  assert.equal(validateSermonAudioUpload("sermon\n.mp3", 12, Uint8Array.from([0x49, 0x44, 0x33])).ok, false);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_EVENT_IMAGE_BYTES,
  validateEventImageUpload,
} from "./event-image-validation.ts";

const signatures = {
  jpeg: [0xff, 0xd8, 0xff, 0x00],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  webp: [
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
    0x50,
  ],
};

test("accepts supported image signatures with matching extensions", () => {
  assert.deepEqual(
    validateEventImageUpload(
      "poster.jpg",
      100,
      Uint8Array.from(signatures.jpeg),
    ),
    {
      ok: true,
      value: { mimeType: "image/jpeg", extension: "jpg" },
    },
  );
  assert.equal(
    validateEventImageUpload(
      "poster.png",
      100,
      Uint8Array.from(signatures.png),
    ).ok,
    true,
  );
  assert.equal(
    validateEventImageUpload(
      "poster.webp",
      100,
      Uint8Array.from(signatures.webp),
    ).ok,
    true,
  );
});

test("rejects unsupported extensions and mismatched file signatures", () => {
  assert.equal(
    validateEventImageUpload(
      "poster.svg",
      100,
      Uint8Array.from(signatures.png),
    ).ok,
    false,
  );
  assert.equal(
    validateEventImageUpload(
      "poster.png",
      100,
      Uint8Array.from(signatures.jpeg),
    ).ok,
    false,
  );
});

test("rejects empty and oversized image uploads", () => {
  assert.equal(
    validateEventImageUpload(
      "poster.png",
      0,
      Uint8Array.from(signatures.png),
    ).ok,
    false,
  );
  assert.equal(
    validateEventImageUpload(
      "poster.png",
      MAX_EVENT_IMAGE_BYTES + 1,
      Uint8Array.from(signatures.png),
    ).ok,
    false,
  );
});

test("rejects filenames containing paths or control characters", () => {
  assert.equal(
    validateEventImageUpload(
      "../poster.png",
      100,
      Uint8Array.from(signatures.png),
    ).ok,
    false,
  );
  assert.equal(
    validateEventImageUpload(
      "poster\n.png",
      100,
      Uint8Array.from(signatures.png),
    ).ok,
    false,
  );
});

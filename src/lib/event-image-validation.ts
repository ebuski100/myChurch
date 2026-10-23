export const MAX_EVENT_IMAGE_BYTES = 5 * 1024 * 1024;

export type EventImageFormat = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

export type EventImageValidationResult =
  | { ok: true; value: EventImageFormat }
  | {
      ok: false;
      reason:
        | "invalid_size"
        | "invalid_filename"
        | "unsupported_format";
    };

function hasBytes(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

export function validateEventImageUpload(
  filename: string,
  declaredSize: number,
  prefix: Uint8Array,
): EventImageValidationResult {
  if (
    !Number.isSafeInteger(declaredSize) ||
    declaredSize <= 0 ||
    declaredSize > MAX_EVENT_IMAGE_BYTES
  ) {
    return { ok: false, reason: "invalid_size" };
  }
  if (
    !filename ||
    filename.length > 255 ||
    filename !== filename.trim() ||
    /[\\/\u0000-\u001f\u007f]/.test(filename)
  ) {
    return { ok: false, reason: "invalid_filename" };
  }

  const extension = filename.split(".").pop()?.toLowerCase();
  if (
    (extension === "jpg" || extension === "jpeg") &&
    hasBytes(prefix, [0xff, 0xd8, 0xff])
  ) {
    return {
      ok: true,
      value: { mimeType: "image/jpeg", extension: "jpg" },
    };
  }
  if (
    extension === "png" &&
    hasBytes(prefix, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return {
      ok: true,
      value: { mimeType: "image/png", extension: "png" },
    };
  }
  if (
    extension === "webp" &&
    hasBytes(prefix, [0x52, 0x49, 0x46, 0x46]) &&
    hasBytes(prefix.slice(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return {
      ok: true,
      value: { mimeType: "image/webp", extension: "webp" },
    };
  }

  return { ok: false, reason: "unsupported_format" };
}

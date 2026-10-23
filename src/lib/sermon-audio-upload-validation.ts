export const SERMON_AUDIO_BUCKET_LIMIT_BYTES = 524_288_000;

export type ValidatedAudioUpload = {
  ok: true;
  mimeType: string;
  extension: string;
};

export type AudioUploadValidationFailure = {
  ok: false;
  reason: "invalid_filename" | "unsupported_format" | "invalid_size" | "invalid_signature";
};

export type AudioUploadValidationResult = ValidatedAudioUpload | AudioUploadValidationFailure;

const FORMAT_BY_EXTENSION: Record<string, { mimeType: string; signature: (bytes: Uint8Array) => boolean }> = {
  ".mp3": {
    mimeType: "audio/mpeg",
    signature: (bytes) =>
      (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
      (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0),
  },
  ".mp4": {
    mimeType: "audio/mp4",
    signature: (bytes) => bytes.length >= 8 && ascii(bytes, 4, 8) === "ftyp",
  },
  ".m4a": {
    mimeType: "audio/mp4",
    signature: (bytes) => bytes.length >= 8 && ascii(bytes, 4, 8) === "ftyp",
  },
  ".aac": {
    mimeType: "audio/aac",
    signature: (bytes) => bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0,
  },
  ".ogg": {
    mimeType: "audio/ogg",
    signature: (bytes) => bytes.length >= 4 && ascii(bytes, 0, 4) === "OggS",
  },
  ".wav": {
    mimeType: "audio/wav",
    signature: (bytes) => bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WAVE",
  },
  ".webm": {
    mimeType: "audio/webm",
    signature: (bytes) => bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3,
  },
  ".flac": {
    mimeType: "audio/flac",
    signature: (bytes) => bytes.length >= 4 && ascii(bytes, 0, 4) === "fLaC",
  },
};

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}

export function validateSermonAudioUpload(
  filename: string,
  sizeBytes: number,
  signature: Uint8Array,
): AudioUploadValidationResult {
  if (
    filename.length === 0 ||
    filename.length > 255 ||
    /[\\/\u0000-\u001f\u007f]/.test(filename) ||
    filename.trim() !== filename
  ) {
    return { ok: false, reason: "invalid_filename" };
  }

  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > SERMON_AUDIO_BUCKET_LIMIT_BYTES) {
    return { ok: false, reason: "invalid_size" };
  }

  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  const format = FORMAT_BY_EXTENSION[extension];
  if (!format) return { ok: false, reason: "unsupported_format" };
  if (!format.signature(signature)) return { ok: false, reason: "invalid_signature" };

  return { ok: true, mimeType: format.mimeType, extension };
}

export type SermonAudioAction = "playback" | "download";

type Relation<T> = T | T[] | null | undefined;

export type SermonAudioAuthorizationRow = {
  id?: unknown;
  resource_type?: unknown;
  publication_status?: unknown;
  published_at?: unknown;
  sermon_details?: Relation<unknown>;
  audio_details?: Relation<unknown>;
  resource_assets?: Relation<unknown>;
};

export type AuthorizedSermonAudio = {
  objectPath: string;
  downloadAllowed: boolean;
  originalFilename: string | null;
};

export type SermonAudioAuthorizationResult =
  | { ok: true; audio: AuthorizedSermonAudio }
  | { ok: false; reason: "invalid_resource" | "download_not_allowed" };

function rows<T>(value: Relation<T>): T[] {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isValidAudioObjectPath(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0 || path.length > 1024 || path !== path.trim()) {
    return false;
  }

  if (path.startsWith("/") || path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path)) {
    return false;
  }

  return path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

export function authorizeSermonAudio(
  row: SermonAudioAuthorizationRow | null,
  resourceId: string,
  action: SermonAudioAction,
  now = new Date(),
): SermonAudioAuthorizationResult {
  if (
    !row ||
    row.id !== resourceId ||
    row.resource_type !== "audio" ||
    row.publication_status !== "published" ||
    typeof row.published_at !== "string"
  ) {
    return { ok: false, reason: "invalid_resource" };
  }

  const publishedAt = Date.parse(row.published_at);
  if (!Number.isFinite(publishedAt) || publishedAt > now.getTime()) {
    return { ok: false, reason: "invalid_resource" };
  }

  const hasSermonDetails = rows(row.sermon_details).some((detail) =>
    isRecord(detail) && detail.resource_id === resourceId,
  );
  const hasAudioDetails = rows(row.audio_details).some((detail) =>
    isRecord(detail) && detail.resource_id === resourceId,
  );

  if (!hasSermonDetails || !hasAudioDetails) {
    return { ok: false, reason: "invalid_resource" };
  }

  const eligibleLink = rows(row.resource_assets).find((link) => {
    if (!isRecord(link) || link.purpose !== "audio") return false;

    return rows(link.assets).some((asset) =>
      isRecord(asset) &&
      asset.storage_bucket === "sermon-audio" &&
      asset.media_type === "audio" &&
      (asset.mime_type == null || (typeof asset.mime_type === "string" && asset.mime_type.startsWith("audio/"))) &&
      isValidAudioObjectPath(asset.object_path),
    );
  });

  if (!isRecord(eligibleLink)) {
    return { ok: false, reason: "invalid_resource" };
  }

  if (action === "download" && eligibleLink.download_allowed !== true) {
    return { ok: false, reason: "download_not_allowed" };
  }

  const asset = rows(eligibleLink.assets).find((candidate) =>
    isRecord(candidate) &&
    candidate.storage_bucket === "sermon-audio" &&
    candidate.media_type === "audio" &&
    (candidate.mime_type == null || (typeof candidate.mime_type === "string" && candidate.mime_type.startsWith("audio/"))) &&
    isValidAudioObjectPath(candidate.object_path),
  );

  if (!isRecord(asset) || !isValidAudioObjectPath(asset.object_path)) {
    return { ok: false, reason: "invalid_resource" };
  }

  return {
    ok: true,
    audio: {
      objectPath: asset.object_path,
      downloadAllowed: eligibleLink.download_allowed === true,
      originalFilename: typeof asset.original_filename === "string" ? asset.original_filename : null,
    },
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

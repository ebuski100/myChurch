export type PublicationCommand = "publish" | "unpublish";
export type StoredPublicationStatus = "draft" | "scheduled" | "published" | "archived";

export type PublicationInput = {
  command: PublicationCommand;
  confirmed: true;
};

export type PublicationCheckResult =
  | { ok: true; audioAssetIds: string[] }
  | {
      ok: false;
      reason: "missing_resource" | "not_audio" | "missing_title" | "missing_sermon_details" | "missing_audio_details" | "missing_audio_asset";
    };

type Relation<T> = T | T[] | null | undefined;

type PublicationRow = {
  id?: unknown;
  title?: unknown;
  resource_type?: unknown;
  sermon_details?: Relation<{ resource_id?: unknown }>;
  audio_details?: Relation<{ resource_id?: unknown }>;
  resource_assets?: Relation<{
    purpose?: unknown;
    asset_id?: unknown;
    assets?: Relation<{ id?: unknown; media_type?: unknown }>;
  }>;
};

export type PrivateAudioAsset = {
  id: unknown;
  storage_bucket: unknown;
  object_path: unknown;
  media_type: unknown;
  mime_type: unknown;
};

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/flac",
]);

function rows<T>(relation: Relation<T>): T[] {
  if (Array.isArray(relation)) return relation;
  return relation == null ? [] : [relation];
}

function isSafeObjectPath(path: unknown): path is string {
  return typeof path === "string" && path.length > 0 && path.length <= 1024 &&
    path === path.trim() && !path.startsWith("/") && !path.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(path) &&
    path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

export function parsePublicationInput(command: FormDataEntryValue | null, confirmation: FormDataEntryValue | null): PublicationInput | null {
  if ((command !== "publish" && command !== "unpublish") || confirmation !== "yes") return null;
  return { command, confirmed: true };
}

export function checkSermonReadyToPublish(row: PublicationRow | null, resourceId: string): PublicationCheckResult {
  if (!row || row.id !== resourceId) return { ok: false, reason: "missing_resource" };
  if (row.resource_type !== "audio") return { ok: false, reason: "not_audio" };
  if (typeof row.title !== "string" || !row.title.trim()) return { ok: false, reason: "missing_title" };

  if (!rows(row.sermon_details).some((detail) => detail.resource_id === resourceId)) {
    return { ok: false, reason: "missing_sermon_details" };
  }
  if (!rows(row.audio_details).some((detail) => detail.resource_id === resourceId)) {
    return { ok: false, reason: "missing_audio_details" };
  }

  const audioAssetIds = rows(row.resource_assets).flatMap((link) => {
    if (link.purpose !== "audio") return [];
    return rows(link.assets).flatMap((asset) =>
      asset.media_type === "audio" &&
      typeof asset.id === "string" &&
      asset.id === link.asset_id
        ? [asset.id]
        : [],
    );
  });

  return audioAssetIds.length > 0
    ? { ok: true, audioAssetIds: [...new Set(audioAssetIds)] }
    : { ok: false, reason: "missing_audio_asset" };
}

export function isValidPrivateSermonAudioAsset(asset: PrivateAudioAsset): asset is PrivateAudioAsset & {
  id: string;
  storage_bucket: "sermon-audio";
  object_path: string;
  media_type: "audio";
  mime_type: string;
} {
  return typeof asset.id === "string" &&
    asset.storage_bucket === "sermon-audio" &&
    isSafeObjectPath(asset.object_path) &&
    asset.media_type === "audio" &&
    typeof asset.mime_type === "string" &&
    ALLOWED_AUDIO_MIME_TYPES.has(asset.mime_type);
}

export function publicationFields(command: PublicationCommand, publishedAt: string): {
  publication_status: "published" | "draft";
  published_at: string | null;
} {
  return command === "publish"
    ? { publication_status: "published", published_at: publishedAt }
    : { publication_status: "draft", published_at: null };
}

export function canChangePublication(command: PublicationCommand, status: StoredPublicationStatus): boolean {
  return command === "publish" ? status === "draft" : status === "published";
}

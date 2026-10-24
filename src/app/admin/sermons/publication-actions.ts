"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { isUuid } from "@/lib/sermon-audio-authorization";
import {
  canTransitionSermon,
  isLifecycleCommand,
  parseLagosScheduleDate,
  sermonLifecycleFields,
  type SermonLifecycleCommand,
} from "@/lib/sermon-lifecycle";
import { checkSermonReadyToPublish, isValidPrivateSermonAudioAsset } from "@/lib/sermon-publication";
import { checkVideoSermonReadyToPublish } from "@/lib/sermon-video-publication";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

export type PublicationActionState = { success?: boolean; message?: string };

async function requireAdmin(): Promise<void> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden") redirect("/admin/login?error=not_admin");
}

function refreshSermonViews(resourceId?: string) {
  if (resourceId) revalidatePath(`/admin/sermons/${resourceId}/edit`);
  revalidatePath("/admin/sermons");
  revalidatePath("/admin");
  revalidatePath("/sermons");
}

async function verifyPublishableAudio(
  resource: Record<string, unknown>,
  resourceId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const readiness = checkSermonReadyToPublish(resource, resourceId);
  if (!readiness.ok) {
    const messages: Record<string, string> = {
      missing_resource: "This sermon could not be found.",
      not_audio: "Only audio sermons can be published through the audio check.",
      missing_title: "Add a sermon title before publishing or scheduling.",
      missing_sermon_details: "Add the sermon details before publishing or scheduling.",
      missing_audio_details: "The required audio details are missing.",
      missing_audio_asset: "Attach a valid private audio recording before publishing or scheduling.",
    };
    return { ok: false, message: messages[readiness.reason] };
  }

  const storageAdmin = createSupabaseStorageServerClient();
  const { data: privateAssets, error } = await storageAdmin
    .from("assets")
    .select("id, storage_bucket, object_path, media_type, mime_type")
    .in("id", readiness.audioAssetIds);
  if (error || !privateAssets?.length) return { ok: false, message: "The linked private audio could not be verified." };

  for (const asset of privateAssets) {
    if (!isValidPrivateSermonAudioAsset(asset)) continue;
    const { data: exists, error: existsError } = await storageAdmin.storage
      .from("sermon-audio")
      .exists(asset.object_path);
    if (!existsError && exists) return { ok: true };
  }
  return { ok: false, message: "The linked private audio file is missing or invalid." };
}

async function verifyPublishableVideo(
  resource: Record<string, unknown>,
  resourceId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const readiness = checkVideoSermonReadyToPublish(resource, resourceId);
  if (!readiness.ok) {
    const messages: Record<string, string> = {
      missing_resource: "This sermon could not be found.",
      not_video: "Only video sermons can be published through the video check.",
      missing_title: "Add a sermon title before publishing or scheduling.",
      missing_sermon_details: "Add the sermon details before publishing or scheduling.",
      missing_video_details: "The required video details are missing.",
      missing_video_url: "Add a valid YouTube URL before publishing or scheduling.",
      invalid_video_url: "The saved YouTube URL is invalid. Update it before publishing or scheduling.",
    };
    return { ok: false, message: messages[readiness.reason] };
  }
  return { ok: true };
}

export async function changeSermonLifecycleAction(
  resourceId: string,
  _previous: PublicationActionState,
  form: FormData,
): Promise<PublicationActionState> {
  await requireAdmin();
  if (!isUuid(resourceId)) return { success: false, message: "This sermon could not be found." };
  const commandValue = form.get("command");
  if (!isLifecycleCommand(commandValue) || form.get("confirmation") !== "yes") {
    return { success: false, message: "Confirm the requested sermon status change and try again." };
  }
  const command: SermonLifecycleCommand = commandValue;
  const schedule = command === "schedule" ? parseLagosScheduleDate(form.get("scheduledAt")) : null;
  if (schedule && !schedule.ok) {
    return { success: false, message: schedule.reason === "not_future"
      ? "Choose a publication time in the future (Africa/Lagos time)."
      : "Enter a valid publication date and time (Africa/Lagos time)." };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data: resource, error } = await supabase
      .from("resources")
      .select(`id, title, resource_type, publication_status, published_at,
        sermon_details(resource_id), audio_details(resource_id),
        video_details(resource_id, external_url),
        resource_assets(purpose, asset_id, assets(id, media_type))`)
      .eq("id", resourceId)
      .in("resource_type", ["audio", "video"])
      .maybeSingle();
    if (error || !resource) return { success: false, message: "This sermon could not be found or loaded." };

    const status = resource.publication_status as "draft" | "scheduled" | "published" | "archived";
    const mediaType = (resource as { resource_type?: unknown }).resource_type === "video" ? "video" : "audio";
    if (!canTransitionSermon(status, command)) {
      return { success: false, message: `A sermon in ${status} status cannot use this action.` };
    }

    if (command === "publish" || command === "schedule") {
      const verified = mediaType === "video"
        ? await verifyPublishableVideo(resource as unknown as Record<string, unknown>, resourceId)
        : await verifyPublishableAudio(resource as unknown as Record<string, unknown>, resourceId);
      if (!verified.ok) return { success: false, message: verified.message };
    }

    const scheduledAt = schedule?.ok ? schedule.iso : undefined;
    const fields = sermonLifecycleFields(command, new Date().toISOString(), scheduledAt);
    if (!fields) return { success: false, message: "Choose a valid future publication time." };
    const { data: updated, error: updateError } = await supabase
      .from("resources")
      .update(fields)
      .eq("id", resourceId)
      .eq("resource_type", mediaType)
      .eq("publication_status", status)
      .select("id")
      .maybeSingle();
    if (updateError || !updated) return { success: false, message: "The sermon status was not changed. Refresh the page and try again." };

    refreshSermonViews(resourceId);
    const messages: Record<SermonLifecycleCommand, string> = {
      publish: "Sermon published. It is now eligible for the public library.",
      schedule: `Sermon scheduled for ${scheduledAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(scheduledAt)) : "the selected time"} WAT. It remains private until the scheduler publishes it.`,
      unpublish: "Sermon unpublished and returned to drafts.",
      cancel_schedule: "Scheduled publication cancelled. The sermon is now a draft.",
      archive: mediaType === "video"
        ? "Sermon archived. Its metadata and YouTube link were retained."
        : "Sermon archived. Its metadata and private audio were retained.",
      restore: "Sermon restored as a draft. Review it before publishing or scheduling.",
    };
    return { success: true, message: messages[command] };
  } catch {
    return { success: false, message: "The sermon status could not be changed. Please try again." };
  }
}

export async function publishSermonAction(resourceId: string, previous: PublicationActionState, form: FormData) {
  form.set("command", "publish");
  return changeSermonLifecycleAction(resourceId, previous, form);
}

export async function unpublishSermonAction(resourceId: string, previous: PublicationActionState, form: FormData) {
  form.set("command", "unpublish");
  return changeSermonLifecycleAction(resourceId, previous, form);
}

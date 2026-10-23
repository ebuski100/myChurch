"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { validateSermonForm, type SermonFieldErrors } from "@/lib/admin-sermon-validation";
import { isUuid } from "@/lib/sermon-audio-authorization";
import { parseDownloadAllowedValue } from "@/lib/sermon-download-setting-validation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export type SermonActionState = {
  message?: string;
  errors?: SermonFieldErrors;
  resourceId?: string;
};

export type AudioDownloadActionState = {
  message?: string;
  success?: boolean;
  downloadAllowed?: boolean;
};

const failed: SermonActionState = { message: "The sermon could not be saved. Please try again." };

async function requireAdmin(): Promise<boolean> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden") redirect("/admin/login?error=not_admin");
  return access.status === "authorized";
}

function refreshSermonViews() {
  revalidatePath("/admin/sermons");
  revalidatePath("/admin");
  revalidatePath("/sermons");
}

export async function updateSermonAudioDownloadAction(
  resourceId: string,
  _previous: AudioDownloadActionState,
  form: FormData,
): Promise<AudioDownloadActionState> {
  await requireAdmin();

  if (!isUuid(resourceId)) return { success: false, message: "This sermon could not be found." };
  const downloadAllowed = parseDownloadAllowedValue(form.get("downloadAllowed"));
  if (downloadAllowed === null) return { success: false, message: "Choose a valid download setting." };

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id, audio_details!inner(resource_id)")
      .eq("id", resourceId)
      .eq("resource_type", "audio")
      .maybeSingle();
    if (resourceError || !resource) {
      return { success: false, message: "This audio sermon could not be found or loaded." };
    }

    const { data: audioLinks, error: linksError } = await supabase
      .from("resource_assets")
      .select("asset_id")
      .eq("resource_id", resourceId)
      .eq("purpose", "audio");
    if (linksError || !audioLinks?.length) {
      return { success: false, message: "Attach an audio recording before changing its download setting." };
    }

    const { data: updatedLinks, error: updateError } = await supabase
      .from("resource_assets")
      .update({ download_allowed: downloadAllowed })
      .eq("resource_id", resourceId)
      .eq("purpose", "audio")
      .select("asset_id");
    if (updateError || !updatedLinks?.length) {
      return { success: false, message: "The download setting was not saved. The existing setting remains in effect." };
    }

    revalidatePath(`/admin/sermons/${resourceId}/edit`);
    revalidatePath("/admin/sermons");
    revalidatePath("/admin");
    revalidatePath("/sermons");
    return {
      success: true,
      downloadAllowed,
      message: downloadAllowed
        ? "Official audio downloads are enabled for this sermon."
        : "Official audio downloads are disabled for this sermon.",
    };
  } catch {
    return { success: false, message: "The download setting could not be saved. The existing setting remains in effect." };
  }
}

export async function createSermonAction(_previous: SermonActionState, form: FormData): Promise<SermonActionState> {
  await requireAdmin();
  try {
    const validated = validateSermonForm(form);
    if (!validated.ok) return { errors: validated.errors, message: "Check the highlighted fields." };

    const supabase = await createSupabaseAuthServerClient();
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .insert({
        resource_type: "audio",
        title: validated.value.title,
        description: validated.value.description,
        publication_status: "draft",
        published_at: null,
      })
      .select("id")
      .single();
    if (resourceError || !resource) return failed;

    const { error: detailsError } = await supabase.from("sermon_details").insert({
      resource_id: resource.id,
      preacher: validated.value.preacher,
      sermon_date: validated.value.sermonDate,
      series: validated.value.series,
    });
    const { error: audioError } = detailsError
      ? { error: detailsError }
      : await supabase.from("audio_details").insert({ resource_id: resource.id });

    if (detailsError || audioError) {
      const { error: cleanupError } = await supabase.from("resources").delete().eq("id", resource.id).eq("resource_type", "audio");
      return cleanupError
        ? { message: "The sermon details could not be saved. The draft record may need administrator review." }
        : { message: "The sermon details could not be saved. The incomplete draft was removed; please try again." };
    }

    refreshSermonViews();
    return { resourceId: resource.id, message: "Draft created. Attach audio or continue this draft later from the sermon list." };
  } catch {
    return failed;
  }
}

export async function updateSermonAction(resourceId: string, _previous: SermonActionState, form: FormData): Promise<SermonActionState> {
  await requireAdmin();
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(resourceId)) {
      return { message: "This sermon could not be found." };
    }
    const validated = validateSermonForm(form);
    if (!validated.ok) return { errors: validated.errors, message: "Check the highlighted fields." };

    const supabase = await createSupabaseAuthServerClient();
    const { data: current, error: readError } = await supabase
      .from("resources")
      .select("id, resource_type, sermon_details!inner(preacher, sermon_date, series), audio_details(duration_seconds)")
      .eq("id", resourceId)
      .eq("resource_type", "audio")
      .maybeSingle();
    if (readError || !current) return { message: "This sermon could not be found or loaded." };

    const sermonDetails = Array.isArray(current.sermon_details) ? current.sermon_details[0] : current.sermon_details;
    const audioDetails = Array.isArray(current.audio_details) ? current.audio_details[0] ?? null : current.audio_details;
    if (!sermonDetails) return { message: "This sermon could not be found or loaded." };

    const { error: detailsError } = await supabase.from("sermon_details").update({
      preacher: validated.value.preacher,
      sermon_date: validated.value.sermonDate,
      series: validated.value.series,
    }).eq("resource_id", resourceId).select("resource_id").single();
    if (detailsError) return failed;

    let insertedAudioDetails = false;
    if (!audioDetails) {
      const { error: audioError } = await supabase.from("audio_details").insert({ resource_id: resourceId });
      if (audioError) {
        await supabase.from("sermon_details").update(sermonDetails).eq("resource_id", resourceId);
        return failed;
      }
      insertedAudioDetails = true;
    }

    const { error: resourceError } = await supabase.from("resources").update({
      title: validated.value.title,
      description: validated.value.description,
    }).eq("id", resourceId).eq("resource_type", "audio").select("id").single();

    if (resourceError) {
      const { error: detailsRollbackError } = await supabase.from("sermon_details").update(sermonDetails).eq("resource_id", resourceId);
      const audioRollback = insertedAudioDetails
        ? await supabase.from("audio_details").delete().eq("resource_id", resourceId)
        : { error: null };
      return detailsRollbackError || audioRollback.error
        ? { message: "The save was incomplete and some previous details could not be restored. Please review this sermon." }
        : failed;
    }

    refreshSermonViews();
  } catch {
    return failed;
  }
  redirect("/admin/sermons?updated=1");
}

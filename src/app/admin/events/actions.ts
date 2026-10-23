"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { isUuid } from "@/lib/sermon-audio-authorization";
import { getEventCreationDestination } from "@/lib/event-creation-flow";
import {
  cleanupUnusedEventPoster,
  isOwnedStagedEventPoster,
} from "@/lib/event-posters";
import {
  validateEventForm,
  type EventFieldErrors,
} from "@/lib/event-validation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export type EventActionState = {
  message?: string;
  errors?: EventFieldErrors;
};

async function requireAdmin(): Promise<string> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");
  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/admin/login");
  return user.id;
}

function readPosterAssetId(form: FormData): string | null | false {
  const value = form.get("posterAssetId");
  if (value === null || value === "") return null;
  return typeof value === "string" && isUuid(value) ? value : false;
}

function posterUploadIsPending(form: FormData): boolean {
  return form.get("posterUploadPending") === "true";
}

function refreshEventViews(eventId?: string) {
  if (eventId) revalidatePath(`/admin/events/${eventId}/edit`);
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  revalidatePath("/events");
}

export async function createEventAction(
  _previous: EventActionState,
  form: FormData,
): Promise<EventActionState> {
  const adminUserId = await requireAdmin();
  if (posterUploadIsPending(form)) {
    return {
      message:
        "Upload the selected poster or remove it before saving the event.",
    };
  }
  const createIntent = form.get("createIntent");
  if (createIntent !== "draft" && createIntent !== "published") {
    return {
      message: "Choose whether to save a draft or publish the event.",
    };
  }
  const formValues = new FormData();
  form.forEach((value, key) => formValues.append(key, value));
  formValues.set("status", createIntent);
  const validated = validateEventForm(formValues, {
    preventPastPublication: true,
  });
  if (!validated.ok) {
    return {
      errors: validated.errors,
      message: "Check the highlighted event fields.",
    };
  }
  const posterAssetId = readPosterAssetId(form);
  if (posterAssetId === false) {
    return {
      message:
        "The selected poster could not be verified. Please upload it again.",
    };
  }
  if (
    posterAssetId &&
    !(await isOwnedStagedEventPoster(posterAssetId, adminUserId))
  ) {
    return {
      message:
        "The selected poster could not be verified. Please upload it again.",
    };
  }

  let createdEventId: string | null = null;
  try {
    const supabase = await createSupabaseAuthServerClient();
    if (posterAssetId) {
      const { error: posterUpdateError } = await supabase
        .from("assets")
        .update({ alt_text: validated.value.title })
        .eq("id", posterAssetId);
      if (posterUpdateError) {
        return {
          message:
            "The event poster could not be attached. Please retry.",
        };
      }
    }
    const { data, error } = await supabase
      .from("events")
      .insert({
        title: validated.value.title,
        description: validated.value.description,
        starts_at: validated.value.startsAt,
        ends_at: validated.value.endsAt,
        location: validated.value.location,
        timezone: "Africa/Lagos",
        poster_asset_id: posterAssetId,
        publication_status: createIntent,
        published_at:
          createIntent === "published"
            ? new Date().toISOString()
            : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        message: "The event could not be created. Please try again.",
      };
    }

    createdEventId = data.id;
    refreshEventViews(data.id);
  } catch {
    return {
      message: "The event could not be created. Please try again.",
    };
  }
  if (!createdEventId)
    return {
      message: "The event could not be created. Please try again.",
    };
  redirect(getEventCreationDestination(createIntent));
}

export async function updateEventAction(
  eventId: string,
  _previous: EventActionState,
  form: FormData,
): Promise<EventActionState> {
  const adminUserId = await requireAdmin();
  if (!isUuid(eventId))
    return { message: "This event could not be found." };
  if (posterUploadIsPending(form)) {
    return {
      message:
        "Upload the selected poster or remove it before saving the event.",
    };
  }

  const posterAssetId = readPosterAssetId(form);
  if (posterAssetId === false) {
    return {
      message:
        "The selected poster could not be verified. Please upload it again.",
    };
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data: current, error: currentError } = await supabase
      .from("events")
      .select("publication_status, published_at, poster_asset_id")
      .eq("id", eventId)
      .maybeSingle();
    if (currentError || !current)
      return { message: "This event could not be found or loaded." };

    const validated = validateEventForm(form, {
      preventPastPublication:
        current.publication_status !== "published",
    });
    if (!validated.ok) {
      return {
        errors: validated.errors,
        message: "Check the highlighted event fields.",
      };
    }

    if (
      posterAssetId &&
      posterAssetId !== current.poster_asset_id &&
      !(await isOwnedStagedEventPoster(posterAssetId, adminUserId))
    ) {
      return {
        message:
          "The selected poster could not be verified. Please upload it again.",
      };
    }
    if (posterAssetId) {
      const { error: posterUpdateError } = await supabase
        .from("assets")
        .update({ alt_text: validated.value.title })
        .eq("id", posterAssetId);
      if (posterUpdateError) {
        return {
          message:
            "The event poster could not be attached. Please retry.",
        };
      }
    }

    const publishedAt =
      validated.value.status === "published"
        ? current.publication_status === "published" &&
          current.published_at
          ? current.published_at
          : new Date().toISOString()
        : null;
    const { data, error } = await supabase
      .from("events")
      .update({
        title: validated.value.title,
        description: validated.value.description,
        starts_at: validated.value.startsAt,
        ends_at: validated.value.endsAt,
        location: validated.value.location,
        timezone: "Africa/Lagos",
        publication_status: validated.value.status,
        published_at: publishedAt,
        poster_asset_id: posterAssetId,
      })
      .eq("id", eventId)
      .select("id")
      .maybeSingle();
    if (error || !data)
      return {
        message: "The event could not be updated. Please try again.",
      };

    refreshEventViews(eventId);
    if (
      current.poster_asset_id &&
      current.poster_asset_id !== posterAssetId
    ) {
      await cleanupUnusedEventPoster(current.poster_asset_id);
    }
  } catch {
    return {
      message: "The event could not be updated. Please try again.",
    };
  }

  redirect("/admin/events?updated=1");
}

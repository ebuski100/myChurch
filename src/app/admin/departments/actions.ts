"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { isUuid } from "@/lib/sermon-audio-authorization";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  cleanupUnreferencedDepartmentMemberPhoto,
  removeNewDepartmentMemberPhotoUpload,
  uploadDepartmentMemberPhoto,
  type DepartmentMemberPhotoUploadFailureReason,
} from "@/lib/department-member-photo-storage";

const allowedStatuses = new Set(["draft", "published", "archived"]);

/**
 * Maps a storage failure to a stable, non-sensitive error code. The real
 * cause is written to the server log by the storage helper; the browser
 * only ever receives this code.
 */
function memberPhotoErrorCode(
  reason: DepartmentMemberPhotoUploadFailureReason,
): string {
  switch (reason) {
    case "too_large":
      return "member_photo_too_large";
    case "invalid_type":
      return "member_photo_invalid";
    case "not_configured":
      return "member_photo_not_configured";
    case "bucket_missing":
      return "member_photo_bucket_missing";
    case "asset_write_failed":
      return "member_photo_asset_write_failed";
    case "storage_error":
      return "member_photo_upload_failed";
  }
}

async function requireAdmin(): Promise<void> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden") redirect("/admin/login?error=not_admin");
}

function field(form: FormData, name: string, maxLength: number): string | null {
  const raw = form.get(name);
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  return value.slice(0, maxLength);
}

function statusFrom(form: FormData): "draft" | "published" | "archived" | null {
  const value = form.get("publicationStatus");
  return typeof value === "string" && allowedStatuses.has(value)
    ? (value as "draft" | "published" | "archived")
    : null;
}

function refreshDepartmentViews(slug?: string) {
  revalidatePath("/admin/departments");
  revalidatePath("/admin");
  revalidatePath("/departments");
  if (slug) revalidatePath(`/departments/${slug}`);
}

export async function updateDepartmentAction(form: FormData): Promise<void> {
  await requireAdmin();
  const id = form.get("departmentId");
  const slug = form.get("slug");
  const name = field(form, "name", 120);
  const publicationStatus = statusFrom(form);
  const sortOrderRaw = form.get("sortOrder");
  const sortOrder = typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw)
    ? Number(sortOrderRaw)
    : null;

  if (typeof id !== "string" || !isUuid(id) || typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name || !publicationStatus || sortOrder === null) {
    redirect("/admin/departments?error=invalid_department");
  }

  const contactLabel = field(form, "contactLabel", 80);
  const contactUrl = field(form, "contactUrl", 500);
  if (Boolean(contactLabel) !== Boolean(contactUrl)) redirect("/admin/departments?error=contact_pair");
  if (contactUrl) {
    try {
      const url = new URL(contactUrl);
      if (!["https:", "http:", "mailto:"].includes(url.protocol)) redirect("/admin/departments?error=contact_url");
    } catch {
      redirect("/admin/departments?error=contact_url");
    }
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data: current, error: currentError } = await supabase
    .from("departments")
    .select("id, publication_status, published_at")
    .eq("id", id)
    .maybeSingle();
  if (currentError || !current) redirect("/admin/departments?error=save_failed");

  const publishedAt = publicationStatus === "published"
    ? current.publication_status === "published" && current.published_at
      ? current.published_at
      : new Date().toISOString()
    : null;

  const { error } = await supabase
    .from("departments")
    .update({
      name,
      short_description: field(form, "shortDescription", 500),
      description: field(form, "description", 5000),
      mission: field(form, "mission", 2000),
      meeting_information: field(form, "meetingInformation", 1000),
      contact_label: contactLabel,
      contact_url: contactUrl,
      sort_order: sortOrder,
      publication_status: publicationStatus,
      published_at: publishedAt,
    })
    .eq("id", id);

  if (error) redirect("/admin/departments?error=save_failed");
  refreshDepartmentViews(slug);
  redirect("/admin/departments?updated=department");
}

export async function createDepartmentMemberAction(form: FormData): Promise<void> {
  await requireAdmin();
  const departmentId = form.get("departmentId");
  const fullName = field(form, "fullName", 160);
  const roleTitle = field(form, "roleTitle", 120);
  const biography = field(form, "biography", 2000);
  const sortOrderRaw = form.get("sortOrder");
  const sortOrder = typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw) ? Number(sortOrderRaw) : 0;

  if (typeof departmentId !== "string" || !isUuid(departmentId) || !fullName) {
    redirect("/admin/departments?error=invalid_member");
  }

  const memberId = randomUUID();
  const photoResult = await uploadDepartmentMemberPhoto(form.get("photo"), memberId, fullName);
  if (!photoResult.ok) {
    redirect(`/admin/departments?error=${memberPhotoErrorCode(photoResult.reason)}`);
  }

  const supabase = await createSupabaseAuthServerClient();
  const { error } = await supabase.from("department_members").insert({
    id: memberId,
    department_id: departmentId,
    full_name: fullName,
    role_title: roleTitle,
    biography,
    photo_asset_id: photoResult.photo?.assetId ?? null,
    sort_order: sortOrder,
    publication_status: "draft",
    is_public: false,
  });

  if (error) {
    if (photoResult.photo) await removeNewDepartmentMemberPhotoUpload(photoResult.photo.assetId, photoResult.photo.objectPath);
    redirect("/admin/departments?error=member_save_failed");
  }
  refreshDepartmentViews();
  redirect("/admin/departments?created=member");
}

export async function updateDepartmentMemberAction(form: FormData): Promise<void> {
  await requireAdmin();
  const memberId = form.get("memberId");
  const departmentId = form.get("departmentId");
  const fullName = field(form, "fullName", 160);
  const roleTitle = field(form, "roleTitle", 120);
  const biography = field(form, "biography", 2000);
  const publicationStatus = statusFrom(form);
  const sortOrderRaw = form.get("sortOrder");
  const sortOrder = typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw) ? Number(sortOrderRaw) : null;
  const isPublic = form.get("isPublic") === "on";
  const removePhoto = form.get("removePhoto") === "on";

  if (typeof memberId !== "string" || !isUuid(memberId) || typeof departmentId !== "string" || !isUuid(departmentId) || !fullName || !publicationStatus || sortOrder === null) {
    redirect("/admin/departments?error=invalid_member");
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data: current, error: currentError } = await supabase
    .from("department_members")
    .select("id, photo_asset_id")
    .eq("id", memberId)
    .eq("department_id", departmentId)
    .maybeSingle();
  if (currentError || !current) redirect("/admin/departments?error=member_save_failed");

  const photoResult = await uploadDepartmentMemberPhoto(form.get("photo"), memberId, fullName);
  if (!photoResult.ok) {
    redirect(`/admin/departments?error=${memberPhotoErrorCode(photoResult.reason)}`);
  }

  const nextPhotoAssetId = photoResult.photo?.assetId ?? (removePhoto ? null : current.photo_asset_id);
  const { error } = await supabase
    .from("department_members")
    .update({
      full_name: fullName,
      role_title: roleTitle,
      biography,
      photo_asset_id: nextPhotoAssetId,
      sort_order: sortOrder,
      publication_status: publicationStatus,
      is_public: publicationStatus === "published" && isPublic,
    })
    .eq("id", memberId)
    .eq("department_id", departmentId);

  if (error) {
    if (photoResult.photo) await removeNewDepartmentMemberPhotoUpload(photoResult.photo.assetId, photoResult.photo.objectPath);
    redirect("/admin/departments?error=member_save_failed");
  }
  if (current.photo_asset_id && current.photo_asset_id !== nextPhotoAssetId) {
    await cleanupUnreferencedDepartmentMemberPhoto(current.photo_asset_id);
  }
  refreshDepartmentViews();
  redirect("/admin/departments?updated=member");
}

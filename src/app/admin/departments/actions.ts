// "use server";

// import { randomUUID } from "node:crypto";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
// import { getAdminAccess } from "@/lib/admin-auth";
// import { isUuid } from "@/lib/sermon-audio-authorization";
// import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
// import {
//   cleanupUnreferencedDepartmentMemberPhoto,
//   removeNewDepartmentMemberPhotoUpload,
//   uploadDepartmentMemberPhoto,
//   type DepartmentMemberPhotoUploadFailureReason,
// } from "@/lib/department-member-photo-storage";

// const allowedStatuses = new Set(["draft", "published", "archived"]);

// /**
//  * Maps a storage failure to a stable, non-sensitive error code. The real
//  * cause is written to the server log by the storage helper; the browser
//  * only ever receives this code.
//  */
// function memberPhotoErrorCode(
//   reason: DepartmentMemberPhotoUploadFailureReason,
// ): string {
//   switch (reason) {
//     case "too_large":
//       return "member_photo_too_large";
//     case "invalid_type":
//       return "member_photo_invalid";
//     case "not_configured":
//       return "member_photo_not_configured";
//     case "bucket_missing":
//       return "member_photo_bucket_missing";
//     case "asset_write_failed":
//       return "member_photo_asset_write_failed";
//     case "storage_error":
//       return "member_photo_upload_failed";
//   }
// }

// async function requireAdmin(): Promise<void> {
//   const access = await getAdminAccess();
//   if (access.status === "unauthenticated") redirect("/admin/login");
//   if (access.status === "forbidden")
//     redirect("/admin/login?error=not_admin");
// }

// function field(
//   form: FormData,
//   name: string,
//   maxLength: number,
// ): string | null {
//   const raw = form.get(name);
//   if (typeof raw !== "string") return null;
//   const value = raw.trim();
//   if (!value) return null;
//   return value.slice(0, maxLength);
// }

// function statusFrom(
//   form: FormData,
// ): "draft" | "published" | "archived" | null {
//   const value = form.get("publicationStatus");
//   return typeof value === "string" && allowedStatuses.has(value)
//     ? (value as "draft" | "published" | "archived")
//     : null;
// }

// function refreshDepartmentViews(slug?: string, memberId?: string) {
//   revalidatePath("/admin/departments");
//   revalidatePath("/admin");
//   revalidatePath("/departments");

//   if (slug) {
//     revalidatePath(`/departments/${slug}`);
//     revalidatePath(`/admin/departments/${slug}`);
//     revalidatePath(`/admin/departments/${slug}/edit`);

//     if (memberId && isUuid(memberId)) {
//       revalidatePath(
//         `/admin/departments/${slug}/members/${memberId}/edit`,
//       );
//     }
//   }
// }

// function redirectToDepartment(slug: string, query: string): never {
//   redirect(`${departmentAdminPath(slug)}?${query}`);
// }

// function redirectToMember(
//   slug: string,
//   memberId: string,
//   query: string,
// ): never {
//   redirect(`${memberAdminPath(slug, memberId)}?${query}`);
// }

// function departmentAdminPath(slug: string): string {
//   if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
//     return "/admin/departments";
//   }

//   return `/admin/departments/${slug}`;
// }

// function memberAdminPath(slug: string, memberId: string): string {
//   const departmentPath = departmentAdminPath(slug);

//   if (departmentPath === "/admin/departments" || !isUuid(memberId)) {
//     return "/admin/departments";
//   }

//   return `${departmentPath}/members/${memberId}/edit`;
// }

// // function redirectToDepartment(slug: string, query: string): never {
// //   redirect(`${departmentAdminPath(slug)}?${query}`);
// // }

// export async function updateDepartmentAction(
//   form: FormData,
// ): Promise<void> {
//   await requireAdmin();
//   const id = form.get("departmentId");
//   const slug = form.get("slug");
//   const name = field(form, "name", 120);
//   const publicationStatus = statusFrom(form);
//   const sortOrderRaw = form.get("sortOrder");
//   const sortOrder =
//     typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw)
//       ? Number(sortOrderRaw)
//       : null;

//   if (
//     typeof id !== "string" ||
//     !isUuid(id) ||
//     typeof slug !== "string" ||
//     !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
//     !name ||
//     !publicationStatus ||
//     sortOrder === null
//   ) {
//     redirect("/admin/departments?error=invalid_department");
//   }

//   const contactLabel = field(form, "contactLabel", 80);
//   const contactUrl = field(form, "contactUrl", 500);
//   if (Boolean(contactLabel) !== Boolean(contactUrl))
//     redirect("/admin/departments?error=contact_pair");
//   if (contactUrl) {
//     try {
//       const url = new URL(contactUrl);
//       if (!["https:", "http:", "mailto:"].includes(url.protocol))
//         redirect("/admin/departments?error=contact_url");
//     } catch {
//       redirect("/admin/departments?error=contact_url");
//     }
//   }

//   const supabase = await createSupabaseAuthServerClient();
//   const { data: current, error: currentError } = await supabase
//     .from("departments")
//     .select("id, publication_status, published_at")
//     .eq("id", id)
//     .maybeSingle();
//   if (currentError || !current)
//     redirect("/admin/departments?error=save_failed");

//   const publishedAt =
//     publicationStatus === "published"
//       ? current.publication_status === "published" &&
//         current.published_at
//         ? current.published_at
//         : new Date().toISOString()
//       : null;

//   const { error } = await supabase
//     .from("departments")
//     .update({
//       name,
//       short_description: field(form, "shortDescription", 500),
//       description: field(form, "description", 5000),
//       mission: field(form, "mission", 2000),
//       meeting_information: field(form, "meetingInformation", 1000),
//       contact_label: contactLabel,
//       contact_url: contactUrl,
//       sort_order: sortOrder,
//       publication_status: publicationStatus,
//       published_at: publishedAt,
//     })
//     .eq("id", id);

//   if (error) redirect("/admin/departments?error=save_failed");
//   refreshDepartmentViews(slug);
//   redirectToDepartment(slug, "updated=department");
// }

// export async function createDepartmentMemberAction(
//   form: FormData,
// ): Promise<void> {
//   const departmentSlug = form.get("departmentSlug");

//   typeof departmentSlug !== "string" ||
// !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(departmentSlug) ||
//   await requireAdmin();
//   const departmentId = form.get("departmentId");
//   const fullName = field(form, "fullName", 160);
//   const roleTitle = field(form, "roleTitle", 120);
//   const biography = field(form, "biography", 2000);
//   const sortOrderRaw = form.get("sortOrder");
//   const sortOrder =
//     typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw)
//       ? Number(sortOrderRaw)
//       : 0;

//   if (
//     typeof departmentId !== "string" ||
//     !isUuid(departmentId) ||
//     !fullName
//   ) {
//     redirect("/admin/departments?error=invalid_member");
//   }

//   const memberId = randomUUID();
//   const photoResult = await uploadDepartmentMemberPhoto(
//     form.get("photo"),
//     memberId,
//     fullName,
//   );
//   if (!photoResult.ok) {
//     redirect(
//       `/admin/departments?error=${memberPhotoErrorCode(photoResult.reason)}`,
//     );
//   }

//   const supabase = await createSupabaseAuthServerClient();
//   const { error } = await supabase.from("department_members").insert({
//     id: memberId,
//     department_id: departmentId,
//     full_name: fullName,
//     role_title: roleTitle,
//     biography,
//     photo_asset_id: photoResult.photo?.assetId ?? null,
//     sort_order: sortOrder,
//     publication_status: "draft",
//     is_public: false,
//   });

//   if (error) {
//     if (photoResult.photo)
//       await removeNewDepartmentMemberPhotoUpload(
//         photoResult.photo.assetId,
//         photoResult.photo.objectPath,
//       );
//     redirect("/admin/departments?error=member_save_failed");
//   }
//   refreshDepartmentViews();
//   redirect("/admin/departments?created=member");
// }

// export async function updateDepartmentMemberAction(
//   form: FormData,
// ): Promise<void> {
//   await requireAdmin();
//   const memberId = form.get("memberId");
//   const departmentId = form.get("departmentId");
//   const fullName = field(form, "fullName", 160);
//   const roleTitle = field(form, "roleTitle", 120);
//   const biography = field(form, "biography", 2000);
//   const publicationStatus = statusFrom(form);
//   const sortOrderRaw = form.get("sortOrder");
//   const sortOrder =
//     typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw)
//       ? Number(sortOrderRaw)
//       : null;
//   const isPublic = form.get("isPublic") === "on";
//   const removePhoto = form.get("removePhoto") === "on";

//   if (
//     typeof memberId !== "string" ||
//     !isUuid(memberId) ||
//     typeof departmentId !== "string" ||
//     !isUuid(departmentId) ||
//     !fullName ||
//     !publicationStatus ||
//     sortOrder === null
//   ) {
//     redirect("/admin/departments?error=invalid_member");
//   }

//   const supabase = await createSupabaseAuthServerClient();
//   const { data: current, error: currentError } = await supabase
//     .from("department_members")
//     .select("id, photo_asset_id")
//     .eq("id", memberId)
//     .eq("department_id", departmentId)
//     .maybeSingle();
//   if (currentError || !current)
//     redirect("/admin/departments?error=member_save_failed");

//   const photoResult = await uploadDepartmentMemberPhoto(
//     form.get("photo"),
//     memberId,
//     fullName,
//   );
//   if (!photoResult.ok) {
//     redirect(
//       `/admin/departments?error=${memberPhotoErrorCode(photoResult.reason)}`,
//     );
//   }

//   const nextPhotoAssetId =
//     photoResult.photo?.assetId ??
//     (removePhoto ? null : current.photo_asset_id);
//   const { error } = await supabase
//     .from("department_members")
//     .update({
//       full_name: fullName,
//       role_title: roleTitle,
//       biography,
//       photo_asset_id: nextPhotoAssetId,
//       sort_order: sortOrder,
//       publication_status: publicationStatus,
//       is_public: publicationStatus === "published" && isPublic,
//     })
//     .eq("id", memberId)
//     .eq("department_id", departmentId);

//   if (error) {
//     if (photoResult.photo)
//       await removeNewDepartmentMemberPhotoUpload(
//         photoResult.photo.assetId,
//         photoResult.photo.objectPath,
//       );
//     redirect("/admin/departments?error=member_save_failed");
//   }
//   if (
//     current.photo_asset_id &&
//     current.photo_asset_id !== nextPhotoAssetId
//   ) {
//     await cleanupUnreferencedDepartmentMemberPhoto(
//       current.photo_asset_id,
//     );
//   }
//   refreshDepartmentViews();
//   redirect("/admin/departments?updated=member");
// }

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

type PublicationStatus = "draft" | "published" | "archived";

function isValidSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

/**
 * Maps storage failures to stable, non-sensitive error codes.
 * The storage helper remains responsible for logging the real cause.
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

  if (access.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (access.status === "forbidden") {
    redirect("/admin/login?error=not_admin");
  }
}

function field(
  form: FormData,
  name: string,
  maxLength: number,
): string | null {
  const raw = form.get(name);

  if (typeof raw !== "string") {
    return null;
  }

  const value = raw.trim();

  if (!value) {
    return null;
  }

  return value.slice(0, maxLength);
}

function statusFrom(form: FormData): PublicationStatus | null {
  const value = form.get("publicationStatus");

  return typeof value === "string" && allowedStatuses.has(value)
    ? (value as PublicationStatus)
    : null;
}

function departmentAdminPath(slug: string): string {
  if (!isValidSlug(slug)) {
    return "/admin/departments";
  }

  return `/admin/departments/${slug}`;
}

function departmentEditPath(slug: string): string {
  const departmentPath = departmentAdminPath(slug);

  if (departmentPath === "/admin/departments") {
    return departmentPath;
  }

  return `${departmentPath}/edit`;
}

function memberAdminPath(slug: string, memberId: string): string {
  const departmentPath = departmentAdminPath(slug);

  if (departmentPath === "/admin/departments" || !isUuid(memberId)) {
    return "/admin/departments";
  }

  return `${departmentPath}/members/${memberId}/edit`;
}

function redirectToDepartment(slug: string, query: string): never {
  redirect(`${departmentAdminPath(slug)}?${query}`);
}

function redirectToDepartmentEdit(
  slug: string,
  query: string,
): never {
  redirect(`${departmentEditPath(slug)}?${query}`);
}

function redirectToMember(
  slug: string,
  memberId: string,
  query: string,
): never {
  redirect(`${memberAdminPath(slug, memberId)}?${query}`);
}

function redirectDepartmentError(
  slug: unknown,
  error: string,
): never {
  if (isValidSlug(slug)) {
    redirectToDepartment(slug, `error=${error}`);
  }

  redirect(`/admin/departments?error=${error}`);
}

function redirectDepartmentEditError(
  slug: unknown,
  error: string,
): never {
  if (isValidSlug(slug)) {
    redirectToDepartmentEdit(slug, `error=${error}`);
  }

  redirect(`/admin/departments?error=${error}`);
}

function redirectMemberError(
  slug: unknown,
  memberId: unknown,
  error: string,
): never {
  if (
    isValidSlug(slug) &&
    typeof memberId === "string" &&
    isUuid(memberId)
  ) {
    redirectToMember(slug, memberId, `error=${error}`);
  }

  redirect(`/admin/departments?error=${error}`);
}

function refreshDepartmentViews(
  slug?: string,
  memberId?: string,
): void {
  revalidatePath("/admin/departments");
  revalidatePath("/admin");
  revalidatePath("/departments");

  if (!slug || !isValidSlug(slug)) {
    return;
  }

  revalidatePath(`/departments/${slug}`);
  revalidatePath(`/admin/departments/${slug}`);
  revalidatePath(`/admin/departments/${slug}/edit`);

  if (memberId && isUuid(memberId)) {
    revalidatePath(
      `/admin/departments/${slug}/members/${memberId}/edit`,
    );
  }
}

export async function updateDepartmentAction(
  form: FormData,
): Promise<void> {
  await requireAdmin();

  const id = form.get("departmentId");
  const slug = form.get("slug");
  const name = field(form, "name", 120);
  const publicationStatus = statusFrom(form);
  const sortOrderRaw = form.get("sortOrder");

  const sortOrder =
    typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw)
      ? Number(sortOrderRaw)
      : null;

  if (
    typeof id !== "string" ||
    !isUuid(id) ||
    !isValidSlug(slug) ||
    !name ||
    !publicationStatus ||
    sortOrder === null
  ) {
    redirectDepartmentEditError(slug, "invalid_department");
  }

  const contactLabel = field(form, "contactLabel", 100);
  const contactUrl = field(form, "contactUrl", 2048);

  if (Boolean(contactLabel) !== Boolean(contactUrl)) {
    redirectToDepartmentEdit(slug, "error=contact_pair");
  }

  if (contactUrl) {
    let validUrl = false;

    try {
      const url = new URL(contactUrl);
      validUrl = ["https:", "http:", "mailto:"].includes(
        url.protocol,
      );
    } catch {
      validUrl = false;
    }

    if (!validUrl) {
      redirectToDepartmentEdit(slug, "error=contact_url");
    }
  }

  const supabase = await createSupabaseAuthServerClient();

  const { data: current, error: currentError } = await supabase
    .from("departments")
    .select("id, slug, publication_status, published_at")
    .eq("id", id)
    .eq("slug", slug)
    .maybeSingle();

  if (currentError || !current) {
    redirectToDepartmentEdit(slug, "error=save_failed");
  }

  const publishedAt =
    publicationStatus === "published"
      ? current.publication_status === "published" &&
        current.published_at
        ? current.published_at
        : new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("departments")
    .update({
      name,
      short_description: field(form, "shortDescription", 500),
      description: field(form, "description", 10000),
      mission: field(form, "mission", 5000),
      meeting_information: field(form, "meetingInformation", 3000),
      contact_label: contactLabel,
      contact_url: contactUrl,
      sort_order: sortOrder,
      publication_status: publicationStatus,
      published_at: publishedAt,
    })
    .eq("id", id)
    .eq("slug", slug);

  if (error) {
    redirectToDepartmentEdit(slug, "error=save_failed");
  }

  refreshDepartmentViews(slug);
  redirectToDepartment(slug, "updated=department");
}

export async function createDepartmentMemberAction(
  form: FormData,
): Promise<void> {
  await requireAdmin();

  const departmentId = form.get("departmentId");
  const departmentSlug = form.get("departmentSlug");
  const fullName = field(form, "fullName", 160);
  const roleTitle = field(form, "roleTitle", 120);
  const biography = field(form, "biography", 2000);
  const sortOrderRaw = form.get("sortOrder");

  const sortOrder =
    typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw)
      ? Number(sortOrderRaw)
      : 0;

  if (
    typeof departmentId !== "string" ||
    !isUuid(departmentId) ||
    !isValidSlug(departmentSlug) ||
    !fullName
  ) {
    redirectDepartmentError(departmentSlug, "invalid_member");
  }

  const supabase = await createSupabaseAuthServerClient();

  // Verify the submitted department ID and slug refer to the same record.
  const { data: department, error: departmentError } = await supabase
    .from("departments")
    .select("id, slug")
    .eq("id", departmentId)
    .eq("slug", departmentSlug)
    .maybeSingle();

  if (departmentError || !department) {
    redirectDepartmentError(departmentSlug, "invalid_member");
  }

  const memberId = randomUUID();

  const photoResult = await uploadDepartmentMemberPhoto(
    form.get("photo"),
    memberId,
    fullName,
  );

  if (!photoResult.ok) {
    redirectDepartmentError(
      departmentSlug,
      memberPhotoErrorCode(photoResult.reason),
    );
  }

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
    if (photoResult.photo) {
      await removeNewDepartmentMemberPhotoUpload(
        photoResult.photo.assetId,
        photoResult.photo.objectPath,
      );
    }

    redirectDepartmentError(departmentSlug, "member_save_failed");
  }

  refreshDepartmentViews(departmentSlug);
  redirectToDepartment(departmentSlug, "created=member");
}

export async function updateDepartmentMemberAction(
  form: FormData,
): Promise<void> {
  await requireAdmin();

  const memberId = form.get("memberId");
  const departmentId = form.get("departmentId");
  const departmentSlug = form.get("departmentSlug");
  const fullName = field(form, "fullName", 160);
  const roleTitle = field(form, "roleTitle", 120);
  const biography = field(form, "biography", 2000);
  const publicationStatus = statusFrom(form);
  const sortOrderRaw = form.get("sortOrder");

  const sortOrder =
    typeof sortOrderRaw === "string" && /^\d{1,5}$/.test(sortOrderRaw)
      ? Number(sortOrderRaw)
      : null;

  const isPublic = form.get("isPublic") === "on";
  const removePhoto = form.get("removePhoto") === "on";

  if (
    typeof memberId !== "string" ||
    !isUuid(memberId) ||
    typeof departmentId !== "string" ||
    !isUuid(departmentId) ||
    !isValidSlug(departmentSlug) ||
    !fullName ||
    !publicationStatus ||
    sortOrder === null
  ) {
    redirectMemberError(departmentSlug, memberId, "invalid_member");
  }

  const supabase = await createSupabaseAuthServerClient();

  // Verify the department slug belongs to the submitted department ID.
  const { data: department, error: departmentError } = await supabase
    .from("departments")
    .select("id, slug")
    .eq("id", departmentId)
    .eq("slug", departmentSlug)
    .maybeSingle();

  if (departmentError || !department) {
    redirectMemberError(
      departmentSlug,
      memberId,
      "member_save_failed",
    );
  }

  const { data: current, error: currentError } = await supabase
    .from("department_members")
    .select("id, department_id, photo_asset_id")
    .eq("id", memberId)
    .eq("department_id", departmentId)
    .maybeSingle();

  if (currentError || !current) {
    redirectMemberError(
      departmentSlug,
      memberId,
      "member_save_failed",
    );
  }

  const photoResult = await uploadDepartmentMemberPhoto(
    form.get("photo"),
    memberId,
    fullName,
  );

  if (!photoResult.ok) {
    redirectMemberError(
      departmentSlug,
      memberId,
      memberPhotoErrorCode(photoResult.reason),
    );
  }

  const nextPhotoAssetId =
    photoResult.photo?.assetId ??
    (removePhoto ? null : current.photo_asset_id);

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
    if (photoResult.photo) {
      await removeNewDepartmentMemberPhotoUpload(
        photoResult.photo.assetId,
        photoResult.photo.objectPath,
      );
    }

    redirectMemberError(
      departmentSlug,
      memberId,
      "member_save_failed",
    );
  }

  if (
    current.photo_asset_id &&
    current.photo_asset_id !== nextPhotoAssetId
  ) {
    await cleanupUnreferencedDepartmentMemberPhoto(
      current.photo_asset_id,
    );
  }

  refreshDepartmentViews(departmentSlug, memberId);
  redirectToMember(departmentSlug, memberId, "updated=member");
}

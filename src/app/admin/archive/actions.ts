"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/sermon-audio-authorization";
import {
  contentArchiveTypes,
  type ContentArchiveType,
} from "@/lib/content-archive-data";
import {
  processContentStorageCleanup,
} from "@/lib/content-archive-storage";
import { getAdminAccessContext } from "@/lib/admin-auth";

function isContentArchiveType(
  value: FormDataEntryValue | null,
): value is ContentArchiveType {
  return (
    typeof value === "string" &&
    contentArchiveTypes.some((type) => type === value)
  );
}

function getReturnPath(value: FormDataEntryValue | null): string {
  if (
    typeof value === "string" &&
    value.startsWith("/admin/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("?") &&
    !value.includes("#") &&
    !value.includes("..")
  ) {
    return value;
  }
  return "/admin/archive";
}

function redirectWithResult(path: string, result: string): never {
  redirect(`${path}?contentArchive=${encodeURIComponent(result)}`);
}

function revalidateContentViews(returnPath: string) {
  revalidatePath(returnPath);
  revalidatePath("/admin/archive");
  revalidatePath("/");
  revalidatePath("/sermons");
  revalidatePath("/events");
  revalidatePath("/books");
  revalidatePath("/documents");
  revalidatePath("/gallery");
  revalidatePath("/ministries");
  revalidatePath("/departments");
}

async function getAuthorizedAccess() {
  let context: Awaited<ReturnType<typeof getAdminAccessContext>>;
  try {
    context = await getAdminAccessContext({ writable: true });
  } catch {
    redirectWithResult("/admin/archive", "error");
  }
  const access = context.access;
  if (access.status === "unauthenticated") {
    redirect("/admin/login");
  }
  if (access.status === "forbidden") {
    redirect("/admin/login?error=not_admin");
  }
  return { supabase: context.supabase, access };
}

function archiveErrorResult(message: string): string {
  if (message === "CONTENT_ARCHIVE_UNVERIFIED") {
    return "unverified";
  }
  if (message.includes("CONTENT_ARCHIVE_CHILDREN_REQUIRED")) {
    return "children_required";
  }
  if (message.includes("CONTENT_ARCHIVE_NOT_PRIMARY")) {
    return "forbidden";
  }
  return "error";
}

async function getPendingCleanupJobIds(
  supabase: Awaited<ReturnType<typeof getAdminAccessContext>>["supabase"],
  contentType: ContentArchiveType,
  contentId: string,
): Promise<string[] | null> {
  const ids: string[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("content_storage_cleanup_jobs")
      .select("id")
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .is("completed_at", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error || !data) return null;

    ids.push(...data.map((job) => job.id));
    if (data.length < pageSize) return ids;
  }
}

export async function archiveOrRestoreContentAction(
  formData: FormData,
): Promise<void> {
  const returnPath = getReturnPath(formData.get("returnTo"));
  const contentType = formData.get("contentType");
  const contentId = formData.get("contentId");
  const operation = formData.get("operation");

  if (
    !isContentArchiveType(contentType) ||
    typeof contentId !== "string" ||
    !isUuid(contentId) ||
    (operation !== "archive" && operation !== "restore")
  ) {
    redirectWithResult(returnPath, "error");
  }

  const { supabase } = await getAuthorizedAccess();
  const rpcName =
    operation === "archive" ? "archive_content" : "restore_content";
  let rpcError: string | null = null;
  try {
    const { error } = await supabase.rpc(rpcName, {
      p_content_type: contentType,
      p_content_id: contentId,
    });
    rpcError = error?.message ?? null;
  } catch {
    rpcError = "CONTENT_ARCHIVE_UNVERIFIED";
  }

  if (rpcError) {
    redirectWithResult(returnPath, archiveErrorResult(rpcError));
  }

  revalidateContentViews(returnPath);
  redirectWithResult(returnPath, operation === "archive" ? "archived" : "restored");
}

export async function permanentlyDeleteContentAction(
  formData: FormData,
): Promise<void> {
  const returnPath = getReturnPath(formData.get("returnTo"));
  const contentType = formData.get("contentType");
  const contentId = formData.get("contentId");

  if (
    !isContentArchiveType(contentType) ||
    typeof contentId !== "string" ||
    !isUuid(contentId)
  ) {
    redirectWithResult(returnPath, "error");
  }

  const { supabase, access } = await getAuthorizedAccess();
  if (access.role !== "primary") {
    redirectWithResult(returnPath, "forbidden");
  }

  let rpcError: string | null = null;
  try {
    const { error } = await supabase.rpc("delete_archived_content", {
      p_content_type: contentType,
      p_content_id: contentId,
    });
    rpcError = error?.message ?? null;
  } catch {
    rpcError = "CONTENT_ARCHIVE_UNVERIFIED";
  }

  if (rpcError) {
    redirectWithResult(returnPath, archiveErrorResult(rpcError));
  }

  let result = "deleted";
  let cleanupJobIds: string[] | null;
  try {
    cleanupJobIds = await getPendingCleanupJobIds(
      supabase,
      contentType,
      contentId,
    );
  } catch {
    cleanupJobIds = null;
  }
  if (cleanupJobIds === null) {
    result = "cleanup_unverified";
  } else if (cleanupJobIds.length > 0) {
    try {
      const cleanup = await processContentStorageCleanup(cleanupJobIds);
      if (cleanup.failed > 0 || cleanup.completed !== cleanup.total) {
        result = "partial_delete";
      }
    } catch {
      result = "partial_delete";
    }
  }

  revalidateContentViews(returnPath);
  redirectWithResult(returnPath, result);
}

export async function retryContentStorageCleanupAction(
  formData: FormData,
): Promise<void> {
  const returnPath = getReturnPath(formData.get("returnTo"));
  const jobId = formData.get("jobId");

  if (typeof jobId !== "string" || !isUuid(jobId)) {
    redirectWithResult(returnPath, "error");
  }

  const { access } = await getAuthorizedAccess();
  if (access.role !== "primary") {
    redirectWithResult(returnPath, "forbidden");
  }

  let cleanup;
  try {
    cleanup = await processContentStorageCleanup([jobId]);
  } catch {
    redirectWithResult(returnPath, "cleanup_pending");
  }

  revalidateContentViews(returnPath);
  redirectWithResult(
    returnPath,
    cleanup.failed === 0 && cleanup.completed === 1
      ? "cleanup_completed"
      : "cleanup_pending",
  );
}

export async function manageContentArchiveAction(
  _previousState: void | undefined,
  formData: FormData,
): Promise<void | undefined> {
  const operation = formData.get("operation");
  if (operation === "archive" || operation === "restore") {
    await archiveOrRestoreContentAction(formData);
    return;
  }
  if (operation === "permanently_delete") {
    await permanentlyDeleteContentAction(formData);
    return;
  }
  if (operation === "retry_cleanup") {
    await retryContentStorageCleanupAction(formData);
    return;
  }
  redirectWithResult(getReturnPath(formData.get("returnTo")), "error");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { isUuid } from "@/lib/sermon-audio-authorization";
import { canTransitionSermon, isLifecycleCommand, sermonLifecycleFields, summarizeBulkLifecycleResults } from "@/lib/sermon-lifecycle";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export type BulkSermonActionItem = {
  resourceId: string;
  success: boolean;
  message: string;
};

export type BulkSermonActionState = {
  command?: string;
  items?: BulkSermonActionItem[];
  message?: string;
};

const BULK_COMMANDS = new Set(["archive", "restore", "cancel_schedule"]);

export async function bulkSermonLifecycleAction(
  _previous: BulkSermonActionState,
  form: FormData,
): Promise<BulkSermonActionState> {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden") redirect("/admin/login?error=not_admin");

  const rawCommand = form.get("command");
  if (!isLifecycleCommand(rawCommand) || !BULK_COMMANDS.has(rawCommand) || form.get("confirmation") !== "yes") {
    return { message: "Confirm one of the available bulk actions and try again." };
  }
  const command = rawCommand;
  const rawIds = form.getAll("resourceId");
  if (rawIds.length === 0 || rawIds.length > 50 || rawIds.some((id) => typeof id !== "string" || !isUuid(id))) {
    return { message: "Select between 1 and 50 valid sermons before continuing." };
  }
  const resourceIds = [...new Set(rawIds as string[])];
  if (resourceIds.length !== rawIds.length) return { message: "Duplicate sermon selections were rejected. Refresh and try again." };

  try {
    const supabase = await createSupabaseAuthServerClient();
    const items: BulkSermonActionItem[] = [];
    for (const resourceId of resourceIds) {
      const { data: resource, error } = await supabase
        .from("resources")
        .select("id, publication_status")
        .eq("id", resourceId)
        .eq("resource_type", "audio")
        .maybeSingle();
      if (error || !resource) {
        items.push({ resourceId, success: false, message: "Could not load sermon." });
        continue;
      }
      const status = resource.publication_status as "draft" | "scheduled" | "published" | "archived";
      if (!canTransitionSermon(status, command)) {
        items.push({ resourceId, success: false, message: `Not eligible from ${status}.` });
        continue;
      }
      const fields = sermonLifecycleFields(command, new Date().toISOString());
      if (!fields) {
        items.push({ resourceId, success: false, message: "Invalid status transition." });
        continue;
      }
      const { data: updated, error: updateError } = await supabase
        .from("resources")
        .update(fields)
        .eq("id", resourceId)
        .eq("resource_type", "audio")
        .eq("publication_status", status)
        .select("id")
        .maybeSingle();
      items.push(updateError || !updated
        ? { resourceId, success: false, message: "Status changed elsewhere or update failed." }
        : { resourceId, success: true, message: command === "archive" ? "Archived." : command === "restore" ? "Restored as draft." : "Scheduling cancelled; now a draft." });
    }

    if (items.some((item) => item.success)) {
      revalidatePath("/admin/sermons");
      revalidatePath("/admin");
      revalidatePath("/sermons");
    }
    const summary = summarizeBulkLifecycleResults(items);
    return {
      command,
      items,
      message: summary.message,
    };
  } catch {
    return { command, message: "The bulk action could not be completed. Refresh and try again." };
  }
}

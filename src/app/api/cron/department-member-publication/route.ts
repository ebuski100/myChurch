import "server-only";

import { revalidatePath } from "next/cache";
import { isValidSchedulerAuthorization } from "@/lib/sermon-scheduler";
import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

const BATCH_SIZE = 100;

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function authorized(request: Request): boolean {
  return isValidSchedulerAuthorization(
    request.headers.get("authorization"),
    process.env.DEPARTMENT_MEMBER_SCHEDULER_SECRET ??
      process.env.SERMON_SCHEDULER_SECRET,
  );
}

type DueMemberRow = {
  id: string;
  department_id: string;
  scheduled_at: string;
  departments:
    | { publication_status: string; published_at: string | null }
    | { publication_status: string; published_at: string | null }[]
    | null;
};

function first<T>(value: T[] | T | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function GET(request: Request) {
  if (!authorized(request))
    return response({ error: "Unauthorized." }, 401);

  try {
    const supabase = createSupabaseStorageServerClient();
    const now = new Date().toISOString();
    const { data: due, error } = await supabase
      .from("department_members")
      .select(
        "id, department_id, scheduled_at, departments!inner(publication_status, published_at)",
      )
      .eq("publication_status", "draft")
      .eq("is_public", false)
      .lte("scheduled_at", now)
      .limit(BATCH_SIZE);

    if (error) return response({ error: "Query failed." }, 500);

    const members = (due ?? []) as DueMemberRow[];
    let activated = 0;
    for (const member of members) {
      const department = first(member.departments);
      if (
        !department ||
        department.publication_status !== "published" ||
        !department.published_at ||
        Date.parse(department.published_at) > Date.now()
      ) {
        continue;
      }

      const { data: updated, error: updateError } = await supabase
        .from("department_members")
        .update({
          publication_status: "published",
          is_public: true,
          scheduled_at: null,
        })
        .eq("id", member.id)
        .eq("publication_status", "draft")
        .eq("is_public", false)
        .eq("scheduled_at", member.scheduled_at)
        .lte("scheduled_at", now)
        .select("id")
        .maybeSingle();

      if (!updateError && updated) {
        activated += 1;
      }
    }

    if (activated > 0) {
      revalidatePath("/departments");
      revalidatePath("/admin/departments");
    }

    return response({ activated, scanned: members.length });
  } catch (error) {
    console.error("department-member-publication cron failed", error);
    return response({ error: "Internal error." }, 500);
  }
}

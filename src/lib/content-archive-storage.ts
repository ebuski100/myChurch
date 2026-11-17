import "server-only";

import { createSupabaseStorageServerClient } from "@/lib/supabase/storage-server";

export type ContentStorageCleanupResult = {
  total: number;
  completed: number;
  failed: number;
};

type CleanupJob = {
  id: string;
  bucket_id: string;
  object_path: string;
  attempt_count: number;
};

export async function processContentStorageCleanup(
  jobIds: string[],
): Promise<ContentStorageCleanupResult> {
  const ids = [...new Set(jobIds)];
  if (ids.length === 0) return { total: 0, completed: 0, failed: 0 };

  const supabase = createSupabaseStorageServerClient();
  let completed = 0;
  let failed = 0;
  const batchSize = 100;

  for (let offset = 0; offset < ids.length; offset += batchSize) {
    const batch = ids.slice(offset, offset + batchSize);
    const { data, error } = await supabase
      .from("content_storage_cleanup_jobs")
      .select("id, bucket_id, object_path, attempt_count")
      .in("id", batch)
      .is("completed_at", null);

    if (error || !data) {
      failed += batch.length;
      continue;
    }

    const jobs = data as CleanupJob[];
    failed += batch.length - jobs.length;

    for (const job of jobs) {
      const claimTime = new Date();
      const reclaimBefore = new Date(claimTime.getTime() - 60 * 60 * 1000).toISOString();
      const { data: claimedJob, error: claimError } = await supabase
        .from("content_storage_cleanup_jobs")
        .update({ claimed_at: claimTime.toISOString() })
        .eq("id", job.id)
        .is("completed_at", null)
        .or(`claimed_at.is.null,claimed_at.lt.${reclaimBefore}`)
        .select("id, bucket_id, object_path, attempt_count")
        .maybeSingle();

      if (claimError || !claimedJob) {
        failed += 1;
        continue;
      }

      let cleanupFailure: string | null = null;
      try {
        const { data: references, error: referenceError } = await supabase
          .from("assets")
          .select("id")
          .eq("storage_bucket", claimedJob.bucket_id)
          .eq("object_path", claimedJob.object_path)
          .limit(1);

        if (referenceError || !references) {
          cleanupFailure = "Storage references could not be verified.";
        } else if (references.length > 0) {
          cleanupFailure = "Storage object is still referenced; cleanup was skipped.";
        } else {
          const { error: removeError } = await supabase.storage
            .from(claimedJob.bucket_id)
            .remove([claimedJob.object_path]);
          if (removeError) cleanupFailure = "Storage object removal failed.";
        }
      } catch {
        cleanupFailure = "Storage cleanup could not be verified.";
      }

      const update = cleanupFailure
        ? {
            attempt_count: claimedJob.attempt_count + 1,
            last_error: cleanupFailure,
            claimed_at: null,
          }
        : {
            attempt_count: claimedJob.attempt_count + 1,
            last_error: null,
            completed_at: new Date().toISOString(),
            claimed_at: null,
          };

      const { error: updateError } = await supabase
        .from("content_storage_cleanup_jobs")
        .update(update)
        .eq("id", claimedJob.id)
        .eq("claimed_at", claimTime.toISOString())
        .is("completed_at", null);

      if (cleanupFailure || updateError) {
        failed += 1;
      } else {
        completed += 1;
      }
    }
  }

  return { total: ids.length, completed, failed };
}

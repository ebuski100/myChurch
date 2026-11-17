import { AdminNotice } from "../admin-notice";

const notices: Record<
  string,
  { kind: "success" | "error" | "warning"; message: string }
> = {
  archived: {
    kind: "success",
    message: "Content archived and removed from public pages.",
  },
  restored: {
    kind: "success",
    message: "Content restored to its previous publication status.",
  },
  deleted: {
    kind: "success",
    message:
      "Archived content was permanently deleted and unshared media was removed.",
  },
  cleanup_completed: {
    kind: "success",
    message: "Pending storage cleanup completed.",
  },
  partial_delete: {
    kind: "warning",
    message:
      "The content and its deletion history were removed, but some media cleanup is still pending. Retry it below.",
  },
  cleanup_unverified: {
    kind: "warning",
    message:
      "The content was deleted, but the storage cleanup status could not be verified. Check the pending cleanup list before retrying.",
  },
  cleanup_pending: {
    kind: "warning",
    message:
      "Storage cleanup is still pending. The job remains available to retry.",
  },
  children_required: {
    kind: "warning",
    message:
      "Archive all photos or department members before permanently deleting their containing album or department.",
  },
  forbidden: {
    kind: "error",
    message: "Only an active primary administrator can permanently delete content.",
  },
  unverified: {
    kind: "warning",
    message:
      "The operation's final status could not be confirmed. Refresh the archive and history before retrying.",
  },
  error: {
    kind: "error",
    message:
      "The archive operation could not be completed. Refresh the page and try again.",
  },
};

export function ContentArchiveNotice({
  result,
  className = "mb-6",
}: {
  result?: string;
  className?: string;
}) {
  if (!result) return null;
  const notice = notices[result];
  if (!notice) return null;

  return (
    <AdminNotice
      message={notice.message}
      kind={notice.kind}
      resetKey={`content-archive-${result}`}
      clearQueryParams={{ contentArchive: result }}
      className={className}
    />
  );
}

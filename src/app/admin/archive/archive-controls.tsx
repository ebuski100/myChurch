"use client";

import { useActionState, useRef, useState } from "react";
import { Button, LoadingButton } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/modal-dialog";
import {
 manageContentArchiveAction,
} from "./actions";
import type { ContentArchiveCandidate, ContentArchiveItem } from "@/lib/content-archive-data";

function ArchiveRestoreConfirmation({
 open,
 archived,
 title,
 pending,
 onConfirm,
 onCancel,
}: {
 open: boolean;
 archived: boolean;
 title: string;
 pending: boolean;
 onConfirm: () => void;
 onCancel: () => void;
}) {
 return (
 <ConfirmationDialog
 open={open}
 title={archived ? "Restore archived content?" : "Archive content?"}
 description={
 <p>
 <span className="font-semibold text-[#344054]">{title}</span>{" "}
 {archived
 ? "will be restored to its previous publication status and become visible according to that status."
 : "will be hidden from public pages. Its record, media, and previous publication status are preserved."}
 </p>
 }
 confirmLabel={archived ? "Restore" : "Archive"}
 pendingLabel={archived ? "Restoring..." : "Archiving..."}
 pending={pending}
 onConfirm={onConfirm}
 onCancel={onCancel}
 />
 );
}

function DeleteConfirmation({
 open,
 title,
 pending,
 onConfirm,
 onCancel,
}: {
 open: boolean;
 title: string;
 pending: boolean;
 onConfirm: () => void;
 onCancel: () => void;
}) {
 return (
 <ConfirmationDialog
 open={open}
 title="Permanently delete archived content?"
 description={
 <p>
 <span className="font-semibold text-[#344054]">{title}</span> and
 its preserved record will be permanently deleted. This cannot be
 undone. Storage files are removed only if no other content uses
 them.
 </p>
 }
 confirmLabel="Permanently delete"
 pendingLabel="Deleting..."
 pending={pending}
 destructive
 onConfirm={onConfirm}
 onCancel={onCancel}
 />
 );
}

export function ContentArchiveActions({
 content,
 archived,
 canPermanentlyDelete = false,
 returnTo = "/admin/archive",
}: {
 content: ContentArchiveCandidate | ContentArchiveItem;
 archived: boolean;
 canPermanentlyDelete?: boolean;
 returnTo?: string;
}) {
 const [archiveOpen, setArchiveOpen] = useState(false);
 const [deleteOpen, setDeleteOpen] = useState(false);
 const [, formAction, pending] = useActionState(
 manageContentArchiveAction,
 undefined,
 );
 const archiveFormRef = useRef<HTMLFormElement>(null);
 const deleteFormRef = useRef<HTMLFormElement>(null);

 return (
 <div className="flex flex-wrap items-center gap-2">
 <span className="sr-only" aria-live="polite">
 {pending ? "Content archive action in progress." : ""}
 </span>
 <form ref={archiveFormRef} action={formAction}>
 <input
 type="hidden"
 name="operation"
 value={archived ? "restore" : "archive"}
 />
 <input
 type="hidden"
 name="contentType"
 value={content.contentType}
 />
 <input type="hidden" name="contentId" value={content.contentId} />
 <input type="hidden" name="returnTo" value={returnTo} />
 <Button
 type="button"
 disabled={pending}
 onClick={() => setArchiveOpen(true)}
 className={
 archived
 ? "min-h-10 rounded-full border border-[#D0D5DD] bg-white px-4 text-xs font-semibold text-[#344054] hover:border-[#D9B66D] hover:bg-[#FFFEFB]"
 : "min-h-10 rounded-full bg-[#101B33] px-4 text-xs font-semibold text-white hover:bg-[#263653]"
 }
 >
 {archived ? "Restore" : "Archive"}
 </Button>
 <ArchiveRestoreConfirmation
 open={archiveOpen}
 archived={archived}
 title={content.title}
 pending={pending}
 onConfirm={() => archiveFormRef.current?.requestSubmit()}
 onCancel={() => setArchiveOpen(false)}
 />
 </form>

 {archived && canPermanentlyDelete && (
 <form ref={deleteFormRef} action={formAction}>
 <input
 type="hidden"
 name="operation"
 value="permanently_delete"
 />
 <input
 type="hidden"
 name="contentType"
 value={content.contentType}
 />
 <input
 type="hidden"
 name="contentId"
 value={content.contentId}
 />
 <input type="hidden" name="returnTo" value={returnTo} />
 <Button
 type="button"
 disabled={pending}
 onClick={() => setDeleteOpen(true)}
 className="min-h-10 rounded-full border border-[#D9B7B7] bg-[#FBF5F5] px-4 text-xs font-semibold text-[#8A4242] hover:border-[#B98181] hover:bg-[#F7EBEB]"
 >
 Permanently delete
 </Button>
 <DeleteConfirmation
 open={deleteOpen}
 title={content.title}
 pending={pending}
 onConfirm={() => deleteFormRef.current?.requestSubmit()}
 onCancel={() => setDeleteOpen(false)}
 />
 </form>
 )}
 </div>
 );
}

export function RetryContentCleanupButton({
 jobId,
 returnTo = "/admin/archive",
}: {
 jobId: string;
 returnTo?: string;
}) {
 const [, formAction, pending] = useActionState(
 manageContentArchiveAction,
 undefined,
 );

 return (
 <form action={formAction}>
 <span className="sr-only" aria-live="polite">
 {pending ? "Storage cleanup is in progress." : ""}
 </span>
 <input type="hidden" name="operation" value="retry_cleanup" />
 <input type="hidden" name="jobId" value={jobId} />
 <input type="hidden" name="returnTo" value={returnTo} />
 <LoadingButton
 type="submit"
 pending={pending}
 pendingLabel="Retrying..."
 className="min-h-10 rounded-full border border-[#D0D5DD] bg-white px-4 text-xs font-semibold text-[#344054] hover:border-[#D9B66D] hover:bg-[#FFFEFB]"
 >
 Retry cleanup
 </LoadingButton>
 </form>
 );
}

// "use client";

// import { useActionState } from "react";
// import { AdminNotice } from "../admin-notice";
// import type { ManagedInvitation } from "@/lib/admin-invitation-data";
// import type { InvitationActionState } from "./actions";

// const initialState: InvitationActionState = {};

// type RevokeFormAction = (
//   previous: InvitationActionState,
//   form: FormData,
// ) => Promise<InvitationActionState>;

// function formatExpiry(value: string): string {
//   return (
//     new Intl.DateTimeFormat("en", {
//       dateStyle: "medium",
//       timeStyle: "short",
//       timeZone: "Africa/Lagos",
//     }).format(new Date(value)) + " WAT"
//   );
// }

// const statusStyles: Record<ManagedInvitation["status"], string> = {
//   pending:
//     "border-[#CFE5D5] bg-[#F0F8F2] text-[#3C704B]",
//   accepted:
//     "border-[#E4E7EC] bg-[#F8F9FB] text-[#475467]",
//   revoked:
//     "border-[#F0D4D4] bg-[#FBF5F5] text-[#8A4242]",
//   expired:
//     "border-[#F3E1B7] bg-[#FFFBF2] text-[#765A22]",
// };

// export function InvitationList({
//   invitations,
//   action,
// }: {
//   invitations: ManagedInvitation[];
//   action: RevokeFormAction;
// }) {
//   const [state, formAction, pending] = useActionState(
//     action,
//     initialState,
//   );

//   const pendingInvitations = invitations.filter(
//     (invitation) => invitation.status === "pending",
//   );
//   const pastInvitations = invitations.filter(
//     (invitation) => invitation.status !== "pending",
//   );

//   return (
//     <div>
//       {state.message && (
//         <AdminNotice
//           message={state.message}
//           kind="error"
//           resetKey={state.message}
//           persistent
//           className="mb-4"
//         />
//       )}

//       {pendingInvitations.length === 0 ? (
//         <p className="rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] px-4 py-3 text-sm leading-6 text-[#475467]">
//           No pending invitations. Sent invitations appear here until
//           they are accepted, expire, or are revoked.
//         </p>
//       ) : (
//         <ul className="divide-y divide-[#F2F4F7] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
//           {pendingInvitations.map((invitation) => (
//             <li
//               key={invitation.id}
//               className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
//             >
//               <div className="min-w-0">
//                 <p className="truncate text-sm font-semibold text-[#101B33]">
//                   {invitation.email}
//                 </p>
//                 <p className="mt-1 text-xs text-[#8A93A3]">
//                   Expires {formatExpiry(invitation.expiresAt)}
//                 </p>
//               </div>
//               <form action={formAction}>
//                 <input
//                   type="hidden"
//                   name="invitationId"
//                   value={invitation.id}
//                 />
//                 <button
//                   type="submit"
//                   disabled={pending}
//                   className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#E4B8B8] px-4 text-sm font-semibold text-[#8A4242] transition hover:bg-[#FBF5F5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A4242]"
//                 >
//                   {pending ? "Revoking…" : "Revoke"}
//                 </button>
//               </form>
//             </li>
//           ))}
//         </ul>
//       )}

//       {pastInvitations.length > 0 && (
//         <div className="mt-6">
//           <h3 className="mb-3 text-sm font-semibold text-[#475467]">
//             Past invitations
//           </h3>
//           <ul className="divide-y divide-[#F2F4F7] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
//             {pastInvitations.map((invitation) => (
//               <li
//                 key={invitation.id}
//                 className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
//               >
//                 <p className="truncate text-sm text-[#101B33]">
//                   {invitation.email}
//                 </p>
//                 <span
//                   className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${statusStyles[invitation.status]}`}
//                 >
//                   {invitation.status}
//                 </span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useActionState } from "react";
import { AdminNotice } from "../admin-notice";
import type { ManagedInvitation } from "@/lib/admin-invitation-data";
import {
  deletePastInvitationAction,
  type InvitationActionState,
} from "./actions";

const initialState: InvitationActionState = {};

type RevokeFormAction = (
  previous: InvitationActionState,
  form: FormData,
) => Promise<InvitationActionState>;

function formatExpiry(value: string): string {
  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(value)) + " WAT"
  );
}

const statusStyles: Record<ManagedInvitation["status"], string> = {
  pending: "border-[#CFE5D5] bg-[#F0F8F2] text-[#3C704B]",
  accepted: "border-[#E4E7EC] bg-[#F8F9FB] text-[#475467]",
  revoked: "border-[#F0D4D4] bg-[#FBF5F5] text-[#8A4242]",
  expired: "border-[#F3E1B7] bg-[#FFFBF2] text-[#765A22]",
};

export function InvitationList({
  invitations,
  action,
}: {
  invitations: ManagedInvitation[];
  action: RevokeFormAction;
}) {
  const [revokeState, revokeFormAction, revokePending] =
    useActionState(action, initialState);

  const [deleteState, deleteFormAction, deletePending] =
    useActionState(deletePastInvitationAction, initialState);

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  const pastInvitations = invitations.filter(
    (invitation) => invitation.status !== "pending",
  );

  return (
    <div>
      {revokeState.message && (
        <AdminNotice
          message={revokeState.message}
          kind="error"
          resetKey={revokeState.message}
          persistent
          className="mb-4"
        />
      )}

      {deleteState.message && (
        <AdminNotice
          message={deleteState.message}
          kind="error"
          resetKey={deleteState.message}
          persistent
          className="mb-4"
        />
      )}

      {pendingInvitations.length === 0 ? (
        <p className="rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] px-4 py-3 text-sm leading-6 text-[#475467]">
          No pending invitations. Sent invitations appear here until
          they are accepted, expire, or are revoked.
        </p>
      ) : (
        <ul className="divide-y divide-[#F2F4F7] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
          {pendingInvitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#101B33]">
                  {invitation.email}
                </p>
                <p className="mt-1 text-xs text-[#8A93A3]">
                  Expires {formatExpiry(invitation.expiresAt)}
                </p>
              </div>

              <form action={revokeFormAction}>
                <input
                  type="hidden"
                  name="invitationId"
                  value={invitation.id}
                />
                <button
                  type="submit"
                  disabled={revokePending}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#E4B8B8] px-4 text-sm font-semibold text-[#8A4242] transition hover:bg-[#FBF5F5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A4242]"
                >
                  {revokePending ? "Revoking…" : "Revoke"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {pastInvitations.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-[#475467]">
            Past invitations
          </h3>

          <ul className="divide-y divide-[#F2F4F7] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
            {pastInvitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <p className="truncate text-sm text-[#101B33]">
                    {invitation.email}
                  </p>

                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${statusStyles[invitation.status]}`}
                  >
                    {invitation.status}
                  </span>
                </div>

                <form
                  action={deleteFormAction}
                  onSubmit={(event) => {
                    const confirmed = window.confirm(
                      `Permanently delete the ${invitation.status} invitation for ${invitation.email}?\n\nThis removes only the invitation record. It does not delete an administrator account or Supabase Auth user.`,
                    );

                    if (!confirmed) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input
                    type="hidden"
                    name="invitationId"
                    value={invitation.id}
                  />

                  <button
                    type="submit"
                    disabled={deletePending}
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#E4B8B8] px-4 text-xs font-semibold text-[#8A4242] transition hover:bg-[#FBF5F5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A4242]"
                  >
                    {deletePending ? "Deleting…" : "Delete"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

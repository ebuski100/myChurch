"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AdminNotice } from "../admin-notice";
import { ConfirmationDialog } from "@/components/ui/modal-dialog";
import type { StandardAdminEntry } from "@/lib/admin-invitation-data";
import type { InvitationActionState } from "./actions";

const initialState: InvitationActionState = {};

type AdminFormAction = (
  previous: InvitationActionState,
  form: FormData,
) => Promise<InvitationActionState>;

type AdminConfirmation = {
  kind: "deactivate" | "reactivate";
  admin: StandardAdminEntry;
};

function formatSince(value: string | null): string {
  if (!value) return "Unknown start date";
  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeZone: "Africa/Lagos",
    }).format(new Date(value)) + " WAT"
  );
}

function adminLabel(admin: StandardAdminEntry): string {
  return admin.email ?? `Administrator ${admin.userId.slice(0, 8)}`;
}

export function StandardAdminList({
  admins,
  deactivateAction,
  reactivateAction,
}: {
  admins: StandardAdminEntry[];
  deactivateAction: AdminFormAction;
  reactivateAction: AdminFormAction;
}) {
  const [deactivateState, deactivateFormAction, deactivatePending] =
    useActionState(deactivateAction, initialState);
  const [reactivateState, reactivateFormAction, reactivatePending] =
    useActionState(reactivateAction, initialState);
  const [confirmation, setConfirmation] =
    useState<AdminConfirmation | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const deactivateFormRef = useRef<HTMLFormElement>(null);
  const reactivateFormRef = useRef<HTMLFormElement>(null);
  const wasDeactivatePending = useRef(false);
  const wasReactivatePending = useRef(false);

  useEffect(() => {
    if (deactivatePending) {
      wasDeactivatePending.current = true;
    } else if (wasDeactivatePending.current) {
      wasDeactivatePending.current = false;
      setConfirmationPending(false);
      setConfirmation((current) =>
        current?.kind === "deactivate" ? null : current,
      );
    }
  }, [deactivatePending]);

  useEffect(() => {
    if (reactivatePending) {
      wasReactivatePending.current = true;
    } else if (wasReactivatePending.current) {
      wasReactivatePending.current = false;
      setConfirmationPending(false);
      setConfirmation((current) =>
        current?.kind === "reactivate" ? null : current,
      );
    }
  }, [reactivatePending]);

  const errorMessage =
    deactivateState.message ?? reactivateState.message;

  const activeAdmins = admins.filter((admin) => admin.isActive);
  const inactiveAdmins = admins.filter((admin) => !admin.isActive);

  return (
    <div>
      {errorMessage && (
        <AdminNotice
          message={errorMessage}
          kind="error"
          resetKey={errorMessage}
          persistent
          className="mb-4"
        />
      )}

      <form ref={deactivateFormRef} action={deactivateFormAction} hidden>
        <input
          type="hidden"
          name="targetUserId"
          value={
            confirmation?.kind === "deactivate"
              ? confirmation.admin.userId
              : ""
          }
        />
      </form>

      <form ref={reactivateFormRef} action={reactivateFormAction} hidden>
        <input
          type="hidden"
          name="targetUserId"
          value={
            confirmation?.kind === "reactivate"
              ? confirmation.admin.userId
              : ""
          }
        />
      </form>

      {activeAdmins.length === 0 ? (
        <p className="rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] px-4 py-3 text-sm leading-6 text-[#475467]">
          No active standard administrators yet. Accepted invitations
          appear here.
        </p>
      ) : (
        <ul className="divide-y divide-[#F2F4F7] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
          {activeAdmins.map((admin) => (
            <li
              key={admin.userId}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#101B33]">
                  {adminLabel(admin)}
                </p>
                <p className="mt-1 text-xs text-[#8A93A3]">
                  Admin since {formatSince(admin.adminSince)}
                </p>
              </div>
              <button
                type="button"
                disabled={deactivatePending || confirmationPending}
                onClick={() =>
                  setConfirmation({ kind: "deactivate", admin })
                }
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E4B8B8] px-4 text-sm font-semibold text-[#8A4242] transition hover:bg-[#FBF5F5] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8A4242]"
              >
                Deactivate
              </button>
            </li>
          ))}
        </ul>
      )}

      {inactiveAdmins.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-[#475467]">
            Deactivated
          </h3>
          <ul className="divide-y divide-[#F2F4F7] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
            {inactiveAdmins.map((admin) => (
              <li
                key={admin.userId}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#667085]">
                    {adminLabel(admin)}
                  </p>
                  <p className="mt-1 text-xs text-[#8A93A3]">
                    Admin since {formatSince(admin.adminSince)}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="inline-flex w-fit items-center rounded-full border border-[#E4E7EC] bg-[#F8F9FB] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A93A3]">
                    Deactivated
                  </span>
                  <button
                    type="button"
                    disabled={reactivatePending || confirmationPending}
                    onClick={() =>
                      setConfirmation({ kind: "reactivate", admin })
                    }
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#CFE5D5] px-4 text-sm font-semibold text-[#3C704B] transition hover:bg-[#F0F8F2] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3C704B]"
                  >
                    Reactivate
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmation && (
        <ConfirmationDialog
          open
          title={
            confirmation.kind === "deactivate"
              ? "Deactivate administrator?"
              : "Reactivate administrator?"
          }
          description={
            confirmation.kind === "deactivate" ? (
              <>
                <strong className="font-semibold text-[#101B33]">
                  {adminLabel(confirmation.admin)}
                </strong>{" "}
                will lose access to the admin dashboard. You can
                reactivate their account later.
              </>
            ) : (
              <>
                <strong className="font-semibold text-[#101B33]">
                  {adminLabel(confirmation.admin)}
                </strong>{" "}
                will regain access to the admin dashboard.
              </>
            )
          }
          confirmLabel={
            confirmation.kind === "deactivate"
              ? "Deactivate"
              : "Reactivate"
          }
          pendingLabel={
            confirmation.kind === "deactivate"
              ? "Deactivating…"
              : "Reactivating…"
          }
          pending={
            confirmationPending ||
            (confirmation.kind === "deactivate"
              ? deactivatePending
              : reactivatePending)
          }
          destructive={confirmation.kind === "deactivate"}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            if (confirmationPending) return;

            if (confirmation.kind === "deactivate") {
              if (deactivatePending || !deactivateFormRef.current) return;
              setConfirmationPending(true);
              deactivateFormRef.current.requestSubmit();
              return;
            }

            if (reactivatePending || !reactivateFormRef.current) return;
            setConfirmationPending(true);
            reactivateFormRef.current.requestSubmit();
          }}
        />
      )}
    </div>
  );
}

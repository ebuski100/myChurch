"use client";

import { useActionState, useState } from "react";
import type { PrimaryTransferCandidate } from "@/lib/primary-transfer";
import { AdminNotice } from "../admin-notice";
import type { PrimaryTransferActionState } from "./actions";

const initialState: PrimaryTransferActionState = {};

type PrimaryTransferFormAction = (
  previous: PrimaryTransferActionState,
  form: FormData,
) => Promise<PrimaryTransferActionState>;

function candidateLabel(candidate: PrimaryTransferCandidate): string {
  return candidate.email ?? `Administrator ${candidate.userId.slice(0, 8)}`;
}

export function PrimaryTransferForm({
  action,
  candidates,
}: {
  action: PrimaryTransferFormAction;
  candidates: PrimaryTransferCandidate[];
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );
  const [targetUserId, setTargetUserId] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const selected =
    candidates.find((candidate) => candidate.userId === targetUserId) ??
    null;
  const canSubmit = !pending && confirmed && selected !== null;

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <AdminNotice
          message={state.message}
          kind="error"
          resetKey={state.message}
          persistent
        />
      )}

      <div>
        <label
          htmlFor="targetUserId"
          className="block text-sm font-semibold text-[#101B33]"
        >
          New primary administrator
        </label>
        <p
          id="targetUserId-hint"
          className="mt-1 text-xs leading-5 text-[#667085]"
        >
          Only active standard administrators are listed. Enrol the
          person as an administrator first if they are missing.
        </p>
        <select
          id="targetUserId"
          name="targetUserId"
          required
          value={targetUserId}
          onChange={(event) => setTargetUserId(event.target.value)}
          aria-describedby="targetUserId-hint"
          className="mt-3 min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#101B33] focus-visible:border-[#9A772E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          <option value="">Select an administrator…</option>
          {candidates.map((candidate) => (
            <option key={candidate.userId} value={candidate.userId}>
              {candidateLabel(candidate)}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="rounded-xl border border-[#F3E1B7] bg-[#FFFBF2] px-4 py-3 text-sm leading-6 text-[#765A22]">
          <p className="font-semibold text-[#101B33]">
            {candidateLabel(selected)} becomes the primary
            administrator.
          </p>
          <p className="mt-1">
            You become a standard administrator and stay signed in.
            This cannot be undone from this screen — only the new
            primary can transfer the seat back.
          </p>
        </div>
      )}

      <label className="flex items-start gap-3 text-sm leading-6 text-[#475467]">
        <input
          type="checkbox"
          name="confirm"
          value="yes"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-[#D0D5DD] accent-[#101B33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        />
        <span>
          I understand that the primary role will move to the selected
          administrator immediately.
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        aria-busy={pending}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] disabled:cursor-not-allowed disabled:bg-[#98A2B3]"
      >
        {pending ? "Transferring…" : "Transfer primary role"}
      </button>
    </form>
  );
}

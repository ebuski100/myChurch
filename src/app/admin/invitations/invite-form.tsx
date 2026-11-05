"use client";

import { useActionState, useState } from "react";
import { AdminNotice } from "../admin-notice";
import type { InvitationActionState } from "./actions";

const initialState: InvitationActionState = {};

type InviteFormAction = (
  previous: InvitationActionState,
  form: FormData,
) => Promise<InvitationActionState>;

export function InviteAdminForm({
  action,
}: {
  action: InviteFormAction;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );
  const [email, setEmail] = useState("");

  return (
    <form action={formAction} className="space-y-4">
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
          htmlFor="email"
          className="block text-sm font-semibold text-[#101B33]"
        >
          Email address
        </label>
        <p
          id="email-hint"
          className="mt-1 text-xs leading-5 text-[#667085]"
        >
          The invitation email is sent to this address, and the new
          administrator must sign in with it to accept. Invitations
          expire after 72 hours and can be used once.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby="email-hint"
            placeholder="new.admin@example.com"
            className="min-h-11 w-full flex-1 rounded-xl border border-[#D0D5DD] bg-white px-3.5 text-sm text-[#101B33] outline-none transition placeholder:text-[#98A2B3] focus:border-[#B99648] focus:ring-2 focus:ring-[#B99648]/15"
          />
          <button
            type="submit"
            disabled={pending || email.trim().length === 0}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition hover:bg-[#263653] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            {pending ? "Sending…" : "Send invitation"}
          </button>
        </div>
      </div>
    </form>
  );
}

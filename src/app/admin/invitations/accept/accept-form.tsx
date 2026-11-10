"use client";

import { useActionState } from "react";
import { AdminNotice } from "../../admin-notice";
import type { InvitationActionState } from "../actions";

const initialState: InvitationActionState = {};

type AcceptFormAction = (
  previous: InvitationActionState,
  form: FormData,
) => Promise<InvitationActionState>;

export function AcceptInvitationForm({
  email,
  token,
  action,
}: {
  email: string;
  token: string;
  action: AcceptFormAction;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );

  return (
    <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 shadow-[0_4px_18px_rgba(16,27,51,0.035)] sm:px-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
        Administrator invitation
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">
        Join as a standard administrator
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#667085]">
        You are signed in as{" "}
        <span className="font-semibold text-[#101B33]">{email}</span>.
        Accepting enrols this account as an active standard
        administrator. The invitation works once — after that, the
        link stops working.
      </p>

      {state.message && (
        <AdminNotice
          message={state.message}
          kind="error"
          resetKey={state.message}
          persistent
          className="mt-5"
        />
      )}

      <form action={formAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition hover:bg-[#263653] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          {pending ? "Accepting…" : "Accept invitation"}
        </button>
      </form>
      <p className="mt-4 text-xs leading-5 text-[#98A2B3]">
        Wrong account? Sign out and sign back in with the invited
        address before accepting.
      </p>
    </div>
  );
}

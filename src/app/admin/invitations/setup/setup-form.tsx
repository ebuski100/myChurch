"use client";

import { useActionState, useState } from "react";
import { AdminNotice } from "../../admin-notice";

export type SetupInvitationActionState = {
  message?: string;
};

const initialState: SetupInvitationActionState = {};

type SetupInvitationFormAction = (
  previous: SetupInvitationActionState,
  form: FormData,
) => Promise<SetupInvitationActionState>;

export function SetupInvitationForm({
  email,
  token,
  action,
}: {
  email: string;
  token: string;
  action: SetupInvitationFormAction;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 shadow-[0_4px_18px_rgba(16,27,51,0.035)] sm:px-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
        Administrator invitation
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">
        Create your password
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#667085]">
        You are setting up{" "}
        <span className="font-semibold text-[#101B33]">{email}</span>.
        Choose a password with at least 8 characters, then your
        administrator account is activated.
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

      <form action={formAction} className="mt-6 space-y-5">
        <input type="hidden" name="token" value={token} />
        <div>
          <label
            htmlFor="setup-password"
            className="mb-2 block text-xs font-semibold text-[#30394A]"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="setup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Choose a password"
              required
              minLength={8}
              className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 pr-20 text-sm text-[#101B33] outline-none transition placeholder:text-[#B0B4BC] hover:border-[#B8BBC2] focus:border-[#A7894B] focus:bg-white focus:ring-4 focus:ring-[#D9B66D]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-3 rounded-md px-2 text-xs font-semibold text-[#8A7447] transition hover:text-[#101B33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7894B]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="setup-password-confirm"
            className="mb-2 block text-xs font-semibold text-[#30394A]"
          >
            Confirm password
          </label>
          <input
            id="setup-password-confirm"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter the same password again"
            required
            minLength={8}
            className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 text-sm text-[#101B33] outline-none transition placeholder:text-[#B0B4BC] hover:border-[#B8BBC2] focus:border-[#A7894B] focus:bg-white focus:ring-4 focus:ring-[#D9B66D]/15"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(16,27,51,0.14)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#1B2B49] hover:shadow-[0_9px_22px_rgba(16,27,51,0.2)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A7894B] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Setting up…" : "Set password and join"}
        </button>
      </form>
      <p className="mt-4 text-xs leading-5 text-[#98A2B3]">
        Wrong account? Sign out and open your invitation link again
        with the invited address.
      </p>
    </div>
  );
}

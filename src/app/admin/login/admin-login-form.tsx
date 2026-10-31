"use client";

import { useState } from "react";

type AdminLoginFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error: string | null;
};

export default function AdminLoginForm({
  action,
  error,
}: AdminLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700"
          >
            !
          </span>
          <p className="text-sm leading-6 text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-semibold text-[#30394A]"
        >
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="admin@example.com"
          required
          className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 text-sm text-[#101B33] outline-none transition placeholder:text-[#B0B4BC] hover:border-[#B8BBC2] focus:border-[#A7894B] focus:bg-white focus:ring-4 focus:ring-[#D9B66D]/15"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-[#30394A]"
          >
            Password
          </label>
        </div>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="h-12 w-full rounded-xl border border-[#DFE1E5] bg-[#FCFCFB] px-4 pr-20 text-sm text-[#101B33] outline-none transition placeholder:text-[#B0B4BC] hover:border-[#B8BBC2] focus:border-[#A7894B] focus:bg-white focus:ring-4 focus:ring-[#D9B66D]/15"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={
              showPassword ? "Hide password" : "Show password"
            }
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-3 rounded-md px-2 text-xs font-semibold text-[#8A7447] transition hover:text-[#101B33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7894B]"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(16,27,51,0.14)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#1B2B49] hover:shadow-[0_9px_22px_rgba(16,27,51,0.2)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A7894B] active:translate-y-0"
      >
        Sign in to dashboard
        <span
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </button>
    </form>
  );
}

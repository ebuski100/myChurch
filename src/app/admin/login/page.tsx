import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { signInAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Sign In | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const access = await getAdminAccess();
  if (access.status === "authorized") redirect("/admin");

  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-[#F8F9FB] px-5 py-16">
      <section className="w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white p-7 shadow-[0_8px_30px_rgba(16,27,51,0.06)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#785B1F]">
          VictoryCity Revival Ministry
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Sign in with an account that has been authorized for administration.
        </p>

        {error === "invalid" && (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            Sign in failed. Check your credentials and try again.
          </p>
        )}
        {(error === "not_admin" || access.status === "forbidden") && (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            This account is not authorized to access the admin area.
          </p>
        )}

        <form action={signInAction} className="mt-7 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#101B33]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="min-h-12 w-full rounded-xl border border-[#D0D5DD] px-4 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/35"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#101B33]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-12 w-full rounded-xl border border-[#D0D5DD] px-4 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/35"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}

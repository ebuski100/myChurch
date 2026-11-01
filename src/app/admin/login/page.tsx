// import type { Metadata } from "next";
// import { redirect } from "next/navigation";
// import { getAdminAccess } from "@/lib/admin-auth";
// import { signInAction } from "./actions";

// export const metadata: Metadata = {
//   title: "Admin Sign In | VictoryCity Revival Ministry",
//   robots: { index: false, follow: false },
// };

// export const instant = false;

// type AdminLoginPageProps = {
//   searchParams: Promise<{ error?: string }>;
// };

// export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
//   const access = await getAdminAccess();
//   if (access.status === "authorized") redirect("/admin");

//   const { error } = await searchParams;

//   return (
//     <main className="flex flex-1 items-center justify-center bg-[#F8F9FB] px-5 py-16">
//       <section className="w-full max-w-md rounded-2xl border border-[#E4E7EC] bg-white p-7 shadow-[0_8px_30px_rgba(16,27,51,0.06)] sm:p-9">
//         <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#785B1F]">
//           VictoryCity Revival Ministry
//         </p>
//         <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">Admin sign in</h1>
//         <p className="mt-2 text-sm leading-6 text-[#667085]">
//           Sign in with an account that has been authorized for administration.
//         </p>

//         {error === "invalid" && (
//           <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
//             Sign in failed. Check your credentials and try again.
//           </p>
//         )}
//         {(error === "not_admin" || access.status === "forbidden") && (
//           <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
//             This account is not authorized to access the admin area.
//           </p>
//         )}

//         <form action={signInAction} className="mt-7 space-y-5">
//           <div>
//             <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#101B33]">
//               Email
//             </label>
//             <input
//               id="email"
//               name="email"
//               type="email"
//               autoComplete="username"
//               required
//               className="min-h-12 w-full rounded-xl border border-[#D0D5DD] px-4 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/35"
//             />
//           </div>
//           <div>
//             <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#101B33]">
//               Password
//             </label>
//             <input
//               id="password"
//               name="password"
//               type="password"
//               autoComplete="current-password"
//               required
//               className="min-h-12 w-full rounded-xl border border-[#D0D5DD] px-4 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/35"
//             />
//           </div>
//           <button
//             type="submit"
//             className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
//           >
//             Sign in
//           </button>
//         </form>
//       </section>
//     </main>
//   );
// }

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { signInAction } from "./actions";
import AdminLoginForm from "./admin-login-form";
import Image from "next/image";
export const metadata: Metadata = {
  title: "Admin Sign In | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const access = await getAdminAccess();

  if (access.status === "authorized") {
    redirect("/admin");
  }

  const { error } = await searchParams;

  const loginError =
    error === "invalid"
      ? "Sign in failed. Please check your email and password."
      : error === "not_admin" || access.status === "forbidden"
        ? "This account does not have permission to access the administration portal."
        : null;

  return (
    <main className="relative flex min-h-[calc(100vh-80px)] flex-1 items-center justify-center overflow-hidden bg-[#F7F7F5] px-5 py-12 sm:px-8 lg:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-[440px] w-[440px] rounded-full bg-[#D8C49A]/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#101B33]/[0.05] blur-3xl"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#E7E5DF] bg-white shadow-[0_24px_80px_rgba(16,27,51,0.09)] lg:min-h-[590px] lg:grid-cols-[0.95fr_1.05fr]">
        {/* Ministry identity panel */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#101B33] px-7 py-9 text-white sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #D9B66D 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />

          <div
            aria-hidden="true"
            className="absolute -right-28 top-1/4 h-80 w-80 rounded-full border border-[#D9B66D]/20"
          />
          <div
            aria-hidden="true"
            className="absolute -right-16 top-[30%] h-56 w-56 rounded-full border border-[#D9B66D]/20"
          />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D9B66D]/50 bg-[#D9B66D]/10">
                {/* <span className="font-serif text-xl font-semibold text-[#E5C887]">
                  V
                </span> */}

                <Image
                  src="/images/victory-city-logo.png"
                  alt="VictoryCity Revival Ministry logo"
                  width={48}
                  height={48}
                  priority
                  className="size-12 shrink-0 rounded-full object-contain"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E5C887]">
                  VictoryCity
                </p>
                <p className="mt-0.5 text-xs text-white/65">
                  Revival Ministry
                </p>
              </div>
            </div>
          </div>

          <div className="relative my-14 lg:my-0">
            <div className="mb-6 h-px w-12 bg-[#D9B66D]" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#E5C887]">
              Administration portal
            </p>

            <h1 className="mt-5 max-w-sm font-serif text-4xl font-medium leading-[1.13] tracking-tight sm:text-5xl">
              Serving the ministry with{" "}
              <span className="italic text-[#E5C887]">
                excellence.
              </span>
            </h1>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/65">
              A dedicated space for managing ministry resources,
              messages, events and the work that keeps our church
              community connected.
            </p>
          </div>

          <div className="relative border-t border-white/10 pt-6">
            <p className="font-serif text-lg italic text-[#E5C887]">
              “Let all things be done decently and in order.”
            </p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              1 Corinthians 14:40
            </p>
          </div>
        </section>

        {/* Login panel */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-sm">
            <div className="mb-9">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9A772E]">
                Secure access
              </p>

              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#101B33] sm:text-[2.15rem]">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#737985]">
                Sign in with your authorized administrator account to
                continue.
              </p>
            </div>

            <AdminLoginForm
              action={signInAction}
              error={loginError}
            />

            <div className="mt-10 border-t border-[#ECEBE7] pt-6">
              <p className="text-center text-xs leading-5 text-[#92969F]">
                Authorized personnel only.
                <br />
                Your access is protected and monitored.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { signOutAction } from "./actions";

export const instant = false;

export default async function AdminPage() {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden") redirect("/admin/login?error=not_admin");

  return (
    <main className="flex flex-1 items-center justify-center bg-[#F8F9FB] px-5 py-16">
      <section className="w-full max-w-2xl rounded-2xl border border-[#E4E7EC] bg-white p-7 shadow-[0_8px_30px_rgba(16,27,51,0.06)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#785B1F]">
          VictoryCity Revival Ministry
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">Admin access</h1>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Your account is authorized. Admin tools will be available here in a later phase.
        </p>
        <form action={signOutAction} className="mt-7">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#101B33] transition-colors hover:border-[#D9B66D] hover:bg-[#FBF8F0] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E]"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { validateInvitationToken } from "@/lib/admin-invitations";
import { buildConfirmErrorUrl } from "@/lib/admin-invite-setup";
import { setupInvitationAction, setupSignOutAction } from "./actions";
import { SetupInvitationForm } from "./setup-form";

export const metadata: Metadata = {
  title: "Set up your account | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

function SetupProblemPanel({
  title,
  message,
  signOut,
}: {
  title: string;
  message: string;
  signOut?: boolean;
}) {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8">
      <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center shadow-[0_4px_18px_rgba(16,27,51,0.035)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
          Administrator invitation
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#667085]">
          {message}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {signOut && (
            <form action={setupSignOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#E4E7EC] px-5 text-sm font-semibold text-[#475467] transition hover:bg-[#F8F9FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
              >
                Sign out
              </button>
            </form>
          )}
          <Link
            href="/admin/login"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            Go to admin sign in
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function InvitationSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = validateInvitationToken(params.token);

  if (!token.ok) {
    return (
      <SetupProblemPanel
        title="This invitation link is not valid"
        message="The link is malformed. Ask the primary administrator to send a fresh invitation."
      />
    );
  }

  const access = await getAdminAccess();

  if (access.status === "authorized") {
    // Already enrolled: nothing to set up. The M12 invitation stays
    // single-use and untouched for its rightful owner.
    redirect("/admin?invitationAccepted=1");
  }

  const { data } = await createSupabaseAuthServerClient().then(
    async (supabase) => supabase.auth.getUser(),
  );
  const email = data.user?.email;

  if (!email) {
    redirect(buildConfirmErrorUrl("session_expired", token.token));
  }

  if (access.status === "forbidden") {
    // Signed in but never enrolled: the expected first-setup state.
    return (
      <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8">
        <SetupInvitationForm
          email={email}
          token={token.token}
          action={setupInvitationAction}
        />
      </main>
    );
  }

  return (
    <SetupProblemPanel
      title="Sign in to set up your account"
      message="Your invitation could not be linked to a verified session. Open your invitation link again."
      signOut
    />
  );
}

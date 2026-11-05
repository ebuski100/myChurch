import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { validateInvitationToken } from "@/lib/admin-invitations";
import { acceptInvitationAction } from "../actions";
import { AcceptInvitationForm } from "./accept-form";

export const metadata: Metadata = {
  title: "Accept invitation | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

function InvalidTokenPanel({ message }: { message: string }) {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8">
      <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center shadow-[0_4px_18px_rgba(16,27,51,0.035)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
          Administrator invitation
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#101B33]">
          This invitation link is not valid
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#667085]">
          {message}
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          Go to admin sign in
        </Link>
      </div>
    </main>
  );
}

function AcceptPanel({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8">
      <AcceptInvitationForm
        email={email}
        token={token}
        action={acceptInvitationAction}
      />
    </main>
  );
}

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = validateInvitationToken(params.token);

  if (!token.ok) {
    return (
      <InvalidTokenPanel message="The link is malformed. Ask the primary administrator to send a fresh invitation." />
    );
  }

  const access = await getAdminAccess();

  if (access.status === "unauthenticated") {
    // Preserve the token across sign-in so the invitee lands back here.
    redirect(
      `/admin/login?invitationToken=${encodeURIComponent(token.token)}`,
    );
  }
  if (access.status === "forbidden") {
    // Signed in, but never enrolled: this is the expected first-accept
    // state, not an error. Fall through to the accept panel, which the
    // action resolves by enrolling the caller.
  }

  const { data } = await createSupabaseAuthServerClient().then(
    async (supabase) => supabase.auth.getUser(),
  );
  const email = data.user?.email ?? "your account";

  if (access.status === "authorized") {
    return (
      <InvalidTokenPanel message="This account is already an administrator — there is nothing to accept. If the invitation was meant for a different address, sign in with that address instead." />
    );
  }

  return <AcceptPanel email={email} token={token.token} />;
}

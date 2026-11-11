import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { getManagedInvitations } from "@/lib/admin-invitation-data";
import { decideInvitationAccess } from "@/lib/admin-invitations";
import { AdminWorkspace } from "../admin-shell";
import { AdminNotice } from "../admin-notice";
import {
  deactivateStandardAdminAction,
  inviteStandardAdminAction,
  reactivateStandardAdminAction,
  revokeInvitationAction,
} from "./actions";
import { InviteAdminForm } from "./invite-form";
import { InvitationList } from "./invitation-list";
import { StandardAdminList } from "./standard-admin-list";

export const metadata: Metadata = {
  title:
    "Administrator invitations | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

function Breadcrumb() {
  return (
    <div className="mb-7 flex items-center gap-2 text-xs text-[#98A2B3]">
      <Link
        href="/admin"
        prefetch={false}
        className="hover:text-[#101B33]"
      >
        Admin
      </Link>
      <span aria-hidden="true">/</span>
      <span className="font-medium text-[#475467]">Invitations</span>
    </div>
  );
}

function RestrictedPanel() {
  return (
    <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-[#101B33]">
        Only the primary administrator can manage invitations
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
        Ask the current primary administrator if an invitation change
        is needed.
      </p>
      <Link
        href="/admin"
        prefetch={false}
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
      >
        Back to overview
      </Link>
    </div>
  );
}

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    invited?: string;
    revoked?: string;
    deactivated?: string;
    reactivated?: string;
  }>;
}) {
  await connection();
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");

  const decision = decideInvitationAccess(access);

  if (!decision.allowed) {
    return (
      <AdminWorkspace activeSection="overview">
        <main className="mx-auto w-full max-w-[1100px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
          <Breadcrumb />
          <RestrictedPanel />
        </main>
      </AdminWorkspace>
    );
  }

  const params = await searchParams;
  const result = await getManagedInvitations();

  return (
    <AdminWorkspace activeSection="overview">
      <main className="mx-auto w-full max-w-[1100px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
        <Breadcrumb />

        <section className="relative isolate overflow-hidden rounded-2xl bg-[#101B33] px-6 py-7 shadow-[0_12px_32px_rgba(16,27,51,0.1)] sm:px-8 sm:py-9">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_84%_18%,rgba(217,182,109,0.19),transparent_35%),radial-gradient(ellipse_at_2%_100%,rgba(62,91,145,0.2),transparent_44%)]"
          />
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E6C77D] sm:text-xs">
              <span className="h-px w-6 bg-[#D9B66D]" />
              Administration
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Administrator invitations
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
              Invite standard administrators by email. Invitations
              expire after 72 hours, work once, and are revoked here
              if plans change.
            </p>
          </div>
        </section>

        {params.invited === "1" && (
          <AdminNotice
            message="Invitation sent. The new administrator must sign in with the invited address, then open the invitation link."
            kind="success"
            resetKey="invited"
            clearQueryParams={{ invited: "1" }}
            className="mt-6"
          />
        )}
        {params.revoked === "1" && (
          <AdminNotice
            message="Invitation revoked. Its link no longer works."
            kind="success"
            resetKey="revoked"
            clearQueryParams={{ revoked: "1" }}
            className="mt-6"
          />
        )}
        {params.deactivated === "1" && (
          <AdminNotice
            message="Administrator deactivated. Their access is removed immediately."
            kind="success"
            resetKey="deactivated"
            clearQueryParams={{ deactivated: "1" }}
            className="mt-6"
          />
        )}
        {params.reactivated === "1" && (
          <AdminNotice
            message="Administrator reactivated. Their access is restored with the same account."
            kind="success"
            resetKey="reactivated"
            clearQueryParams={{ reactivated: "1" }}
            className="mt-6"
          />
        )}

        <section
          aria-labelledby="invite-heading"
          className="mt-8 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_4px_18px_rgba(16,27,51,0.035)] sm:p-6"
        >
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
              New invitation
            </p>
            <h2
              id="invite-heading"
              className="mt-2 text-xl font-semibold tracking-tight text-[#101B33]"
            >
              Invite a standard administrator
            </h2>
          </div>

          <InviteAdminForm action={inviteStandardAdminAction} />
        </section>

        <section aria-labelledby="pending-heading" className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
              Invitations
            </p>
            <h2
              id="pending-heading"
              className="mt-2 text-xl font-semibold tracking-tight text-[#101B33]"
            >
              Pending and past invitations
            </h2>
          </div>

          {result.kind === "error" ? (
            <p
              role="status"
              className="rounded-xl border border-[#F2D7A1] bg-[#FFF9EC] px-4 py-3 text-sm leading-6 text-[#77591F]"
            >
              The invitation list could not be loaded. Try again in a
              moment — nothing has changed.
            </p>
          ) : (
            <InvitationList
              invitations={result.invitations}
              action={revokeInvitationAction}
            />
          )}
        </section>

        <section aria-labelledby="admins-heading" className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
              Team
            </p>
            <h2
              id="admins-heading"
              className="mt-2 text-xl font-semibold tracking-tight text-[#101B33]"
            >
              Standard administrators
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Deactivating removes access immediately, including
              content write access. The primary seat is never affected
              here — use the transfer screen to hand it over.
            </p>
          </div>

          {result.kind === "error" ? (
            <p
              role="status"
              className="rounded-xl border border-[#F2D7A1] bg-[#FFF9EC] px-4 py-3 text-sm leading-6 text-[#77591F]"
            >
              The administrator list could not be loaded. Try again in
              a moment — nothing has changed.
            </p>
          ) : (
            <StandardAdminList
              admins={result.admins}
              deactivateAction={deactivateStandardAdminAction}
              reactivateAction={reactivateStandardAdminAction}
            />
          )}
        </section>
      </main>
    </AdminWorkspace>
  );
}

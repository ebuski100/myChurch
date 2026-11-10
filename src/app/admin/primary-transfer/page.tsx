import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { getPrimaryTransferPageData } from "@/lib/admin-primary-data";
import { decidePrimaryTransferAccess } from "@/lib/primary-transfer";
import { AdminWorkspace } from "../admin-shell";
import { transferPrimaryAdminAction } from "./actions";
import { PrimaryTransferForm } from "./transfer-form";

export const metadata: Metadata = {
  title:
    "Primary role transfer | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

function formatTransferredAt(value: string): string {
  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Lagos",
    }).format(new Date(value)) + " WAT"
  );
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function Breadcrumb() {
  return (
    <div className="mb-7 flex items-center gap-2 text-xs text-[#98A2B3]">
      <Link href="/admin" prefetch={false} className="hover:text-[#101B33]">
        Admin
      </Link>
      <span aria-hidden="true">/</span>
      <span className="font-medium text-[#475467]">Primary role</span>
    </div>
  );
}

function RestrictedPanel() {
  return (
    <div className="rounded-2xl border border-[#E4E7EC] bg-white px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-[#101B33]">
        Only the primary administrator can transfer the primary role
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
        Ask the current primary administrator if this change is
        needed.
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

export default async function PrimaryTransferPage() {
  await connection();
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");

  const decision = decidePrimaryTransferAccess(access);

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

  const { candidates: candidatesResult, history: historyResult } =
    await getPrimaryTransferPageData(10);

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
              Primary role transfer
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
              Hand the primary administrator seat to another active
              administrator. The change is recorded, and the database
              checks every condition before anything is written.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="transfer-heading"
          className="mt-8 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_4px_18px_rgba(16,27,51,0.035)] sm:p-6"
        >
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
              Hand over the seat
            </p>
            <h2
              id="transfer-heading"
              className="mt-2 text-xl font-semibold tracking-tight text-[#101B33]"
            >
              Choose the next primary administrator
            </h2>
          </div>

          {candidatesResult.kind === "error" ? (
            <div
              role="alert"
              className="rounded-xl border border-[#F0D4D4] bg-[#FBF5F5] px-4 py-3 text-sm leading-6 text-[#8A4242]"
            >
              The list of eligible administrators could not be loaded.
              Try again in a moment — nothing has changed.
            </div>
          ) : candidatesResult.candidates.length === 0 ? (
            <div className="rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] px-4 py-3 text-sm leading-6 text-[#475467]">
              There are no active standard administrators to hand the
              seat to. Enrol an administrator first, then return to
              this screen.
            </div>
          ) : (
            <PrimaryTransferForm
              action={transferPrimaryAdminAction}
              candidates={candidatesResult.candidates}
            />
          )}
        </section>

        <section aria-labelledby="history-heading" className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
              Audit trail
            </p>
            <h2
              id="history-heading"
              className="mt-2 text-xl font-semibold tracking-tight text-[#101B33]"
            >
              Recent transfers
            </h2>
          </div>

          {historyResult.kind === "error" ? (
            <p
              role="status"
              className="rounded-xl border border-[#F2D7A1] bg-[#FFF9EC] px-4 py-3 text-sm leading-6 text-[#77591F]"
            >
              The transfer history could not be loaded. The transfer
              form above is unaffected.
            </p>
          ) : historyResult.entries.length === 0 ? (
            <p className="rounded-xl border border-[#E4E7EC] bg-white px-4 py-3 text-sm leading-6 text-[#667085]">
              No primary role transfers have been recorded yet.
            </p>
          ) : (
            <ol className="divide-y divide-[#F2F4F7] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
              {historyResult.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-[#101B33]">
                    <span className="font-mono text-xs text-[#475467]">
                      {shortId(entry.previousPrimaryId)}
                    </span>{" "}
                    <span aria-hidden="true">→</span>
                    <span className="sr-only">
                      {" "}
                      transferred to{" "}
                    </span>{" "}
                    <span className="font-mono text-xs text-[#475467]">
                      {shortId(entry.newPrimaryId)}
                    </span>
                  </p>
                  <p className="text-xs text-[#8A93A3]">
                    {formatTransferredAt(entry.transferredAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </AdminWorkspace>
  );
}

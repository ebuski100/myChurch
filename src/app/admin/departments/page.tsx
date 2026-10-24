import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminDepartments } from "@/lib/admin-department-data";
import { AdminWorkspace } from "../admin-shell";

export const metadata: Metadata = {
  title: "Departments | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "published"
      ? "border-[#B7DEC5] bg-[#EFFAF3] text-[#276749]"
      : status === "archived"
        ? "border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
        : "border-[#F2D7A1] bg-[#FFF9EC] text-[#77591F]";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${styles}`}
    >
      {status}
    </span>
  );
}

function QueryNotice({
  params,
}: {
  params: { created?: string; updated?: string; error?: string };
}) {
  let message = "";
  const error = Boolean(params.error);
  if (params.created === "member")
    message =
      "Member added as a draft. Review their details and publish only with permission.";
  else if (params.updated === "department")
    message = "Department details saved.";
  else if (params.updated === "member")
    message = "Member profile saved.";
  else if (params.error === "contact_pair")
    message =
      "Add both a contact label and a contact URL, or leave both blank.";
  else if (params.error === "contact_url")
    message = "Use a valid HTTP, HTTPS, or mailto contact URL.";
  else if (params.error === "invalid_department")
    message =
      "Some department fields are invalid. Check the name, status, and display order.";
  else if (params.error === "invalid_member")
    message =
      "A member name or required form value is missing or invalid.";
  else if (params.error === "member_photo_invalid")
    message = "Choose a valid JPEG, PNG, or WebP image file.";
  else if (params.error === "member_photo_too_large")
    message = "The profile picture must be 5 MB or smaller.";
  else if (params.error === "member_photo_upload_failed")
    message =
      "The profile picture could not be uploaded. Check local Supabase storage and try again.";
  else if (params.error === "member_photo_bucket_missing")
    message =
      "The profile picture storage bucket is missing. Apply the department member photo migration, then try again.";
  else if (params.error === "member_photo_not_configured")
    message =
      "Photo storage is not configured on this server. Check the Supabase environment settings and try again.";
  else if (params.error === "member_photo_asset_write_failed")
    message =
      "The profile picture was uploaded, but its record could not be saved. The server log has details.";
  else if (params.error === "member_save_failed")
    message =
      "The member could not be saved. Check the local Supabase logs and try again.";
  else if (params.error === "save_failed")
    message =
      "The department could not be saved. Check the local Supabase logs and try again.";
  if (!message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mb-5 rounded-xl border px-4 py-3 text-sm leading-6 ${error ? "border-[#F0D4D4] bg-[#FFF5F5] text-[#912018]" : "border-[#B7DEC5] bg-[#EFFAF3] text-[#276749]"}`}
    >
      {message}
    </p>
  );
}

export default async function AdminDepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
}) {
  await connection();
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");

  const [params, result] = await Promise.all([
    searchParams,
    getAdminDepartments(),
  ]);

  return (
    <AdminWorkspace activeSection="departments">
      <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 xl:px-10">
        <div className="mb-7 flex items-center gap-2 text-xs text-[#98A2B3]">
          <Link href="/admin" className="hover:text-[#101B33]">
            Admin
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#475467]">
            Departments
          </span>
        </div>

        <header className="mb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
            People &amp; teams
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101B33]">
            Departments
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
            Manage the five church departments, their public
            descriptions, and member profiles. New member profiles
            start as private drafts.
          </p>
        </header>

        <QueryNotice params={params} />

        {result.kind === "error" ? (
          <section
            role="alert"
            className="rounded-2xl border border-[#F0D4D4] bg-white px-6 py-10 text-center"
          >
            <h2 className="text-lg font-semibold text-[#101B33]">
              Departments could not be loaded
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">
              Check that the Stage 1 migration is applied to your
              local Supabase instance and that your administrator
              session is valid.
            </p>
            <Link
              href="/admin/departments"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white"
            >
              Try again
            </Link>
          </section>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.departments.map((department) => {
              const publicMembers = department.members.filter(
                (member) =>
                  member.status === "published" && member.isPublic,
              ).length;

              return (
                <article
                  key={department.id}
                  className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E0E4EB] bg-white shadow-[0_5px_20px_rgba(16,27,51,0.045)] transition-[border-color,box-shadow] duration-200 hover:border-[#D9B66D] hover:shadow-[0_10px_28px_rgba(16,27,51,0.075)]"
                >
                  <div className="h-1.5 bg-[#D9B66D]" />

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A772E]">
                          Church department
                        </p>
                        <h2 className="mt-2 break-words text-xl font-semibold tracking-tight text-[#101B33]">
                          {department.name}
                        </h2>
                        <p className="mt-1 break-words text-xs text-[#667085]">
                          /{department.slug}
                        </p>
                      </div>

                      <StatusPill status={department.status} />
                    </div>

                    {department.shortDescription ? (
                      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[#667085]">
                        {department.shortDescription}
                      </p>
                    ) : (
                      <p className="mt-4 min-h-[4.5rem] text-sm leading-6 text-[#98A2B3]">
                        No short introduction added yet.
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F7F8FA] p-3">
                        <p className="text-2xl font-semibold tabular-nums text-[#101B33]">
                          {department.members.length}
                        </p>
                        <p className="mt-1 text-xs text-[#667085]">
                          Total members
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F7F8FA] p-3">
                        <p className="text-2xl font-semibold tabular-nums text-[#101B33]">
                          {publicMembers}
                        </p>
                        <p className="mt-1 text-xs text-[#667085]">
                          Public profiles
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <Link
                        href={`/admin/departments/${department.slug}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#101B33] px-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/departments/${department.slug}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#D0D5DD] bg-white px-3 text-center text-sm font-semibold text-[#344054] transition-colors hover:border-[#D9B66D] hover:bg-[#FFFEFB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </AdminWorkspace>
  );
}

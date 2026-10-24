import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminDepartments } from "@/lib/admin-department-data";
import { AddMemberModal } from "../add-member-modal";
import { AdminWorkspace } from "../../admin-shell";

export const metadata: Metadata = {
  title: "Department Members | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

type PageSearchParams = {
  status?: string;
  created?: string;
  updated?: string;
  error?: string;
};

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

function Notice({ params }: { params: PageSearchParams }) {
  let message = "";
  const isError = Boolean(params.error);

  if (params.created === "member") {
    message =
      "Member added as a private draft. Review their details before publishing.";
  } else if (params.updated === "department") {
    message = "Department details saved successfully.";
  } else if (params.updated === "member") {
    message = "Member profile saved successfully.";
  } else if (params.error === "invalid_department") {
    message =
      "The department details were invalid. Please review them and try again.";
  } else if (params.error === "contact_pair") {
    message =
      "Provide both the contact label and contact URL, or leave both empty.";
  } else if (params.error === "contact_url") {
    message =
      "The contact URL is invalid. Use a valid HTTP, HTTPS, or mailto URL.";
  } else if (params.error === "save_failed") {
    message = "The department could not be saved. Please try again.";
  } else if (params.error === "invalid_member") {
    message = "Check the member's name and required form fields.";
  } else if (params.error === "member_photo_invalid") {
    message = "Choose a valid JPEG, PNG, or WebP image.";
  } else if (params.error === "member_photo_too_large") {
    message = "The profile picture must be 5 MB or smaller.";
  } else if (params.error === "member_photo_upload_failed") {
    message =
      "The photo could not be uploaded. Check Supabase storage and try again.";
  } else if (params.error === "member_photo_bucket_missing") {
    message =
      "The department member photo storage bucket is missing.";
  } else if (params.error === "member_photo_not_configured") {
    message = "Photo storage is not configured on the server.";
  } else if (params.error === "member_photo_asset_write_failed") {
    message =
      "The photo was uploaded, but its asset record could not be saved.";
  } else if (params.error === "member_save_failed") {
    message =
      "The member could not be saved. Check the Supabase logs and try again.";
  }

  if (!message) return null;

  return (
    <p
      role={isError ? "alert" : "status"}
      className={`mb-6 rounded-xl border px-4 py-3 text-sm leading-6 ${
        isError
          ? "border-[#F0D4D4] bg-[#FFF5F5] text-[#912018]"
          : "border-[#B7DEC5] bg-[#EFFAF3] text-[#276749]"
      }`}
    >
      {message}
    </p>
  );
}

type MemberCardData = {
  id: string;
  fullName: string;
  roleTitle: string | null;
  biography: string | null;
  photoUrl: string | null;
  status: "draft" | "published" | "archived";
  isPublic: boolean;
  sortOrder: number;
};

// function MemberCard({
//   member,
//   departmentSlug,
// }: {
//   member: MemberCardData;
//   departmentSlug: string;
// }) {
//   return (
//     <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_4px_18px_rgba(16,27,51,0.035)]">
//       <div className="flex items-start gap-4 p-4 sm:p-5">
//         <div className="size-[76px] shrink-0 overflow-hidden rounded-xl border border-[#EAECF0] bg-[#F7F8FA] sm:size-[88px]">
//           {member.photoUrl ? (
//             // The existing server helper provides signed URLs for private photos.
//             // eslint-disable-next-line @next/next/no-img-element
//             <img
//               src={member.photoUrl}
//               alt={`Profile photo of ${member.fullName}`}
//               className="size-full object-cover"
//             />
//           ) : (
//             <div className="flex size-full items-center justify-center text-2xl font-semibold text-[#98A2B3]">
//               {member.fullName.trim().charAt(0).toUpperCase()}
//             </div>
//           )}
//         </div>

//         <div className="min-w-0 flex-1">
//           <div className="flex flex-wrap items-center gap-2">
//             <h3 className="break-words text-base font-semibold text-[#101B33]">
//               {member.fullName}
//             </h3>
//             <StatusPill status={member.status} />
//           </div>

//           <p className="mt-1 text-sm text-[#667085]">
//             {member.roleTitle || "No role assigned"}
//           </p>

//           <p className="mt-2 text-xs font-medium text-[#667085]">
//             {member.status === "published" && member.isPublic
//               ? "Approved for public display"
//               : "Not publicly displayed"}
//           </p>
//         </div>
//       </div>

//       {member.biography && (
//         <p className="whitespace-pre-line px-4 pb-4 text-sm leading-6 text-[#667085] sm:px-5">
//           {member.biography}
//         </p>
//       )}

//       <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#EAECF0] bg-[#FCFCFD] px-4 py-3 sm:px-5">
//         <span className="text-xs text-[#98A2B3]">
//           Display order: {member.sortOrder}
//         </span>

//         <Link
//           href={`/admin/departments/${departmentSlug}/members/${member.id}/edit`}
//           className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#D0D5DD] bg-white px-4 text-xs font-semibold text-[#344054] transition-colors hover:border-[#D9B66D] hover:bg-[#FFFEFB]"
//         >
//           Edit member
//         </Link>
//       </div>
//     </article>
//   );
// }

function MemberCard({
  member,
  departmentSlug,
}: {
  member: MemberCardData;
  departmentSlug: string;
}) {
  const biographyPreview = member.biography
    ? member.biography.length > 70
      ? `${member.biography.slice(0, 70).trimEnd()}…`
      : member.biography
    : null;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_4px_18px_rgba(16,27,51,0.035)]">
      <div className="flex min-w-0 items-start gap-4 p-4 sm:p-5">
        <div className="size-[76px] shrink-0 overflow-hidden rounded-xl border border-[#EAECF0] bg-[#F7F8FA] sm:size-[88px]">
          {member.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photoUrl}
              alt={`Profile photo of ${member.fullName}`}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-2xl font-semibold text-[#98A2B3]">
              {member.fullName.trim().charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-semibold text-[#101B33]">
              {member.fullName}
            </h3>
            <StatusPill status={member.status} />
          </div>

          <p className="mt-1 break-words text-sm text-[#667085]">
            {member.roleTitle || "No role assigned"}
          </p>

          <p className="mt-2 text-xs font-medium text-[#667085]">
            {member.status === "published" && member.isPublic
              ? "Approved for public display"
              : "Not publicly displayed"}
          </p>
        </div>
      </div>

      {biographyPreview && (
        <p className="min-w-0 whitespace-pre-line break-words px-4 pb-4 text-sm leading-6 text-[#667085] sm:px-5">
          {biographyPreview}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#EAECF0] bg-[#FCFCFD] px-4 py-3 sm:px-5">
        <span className="text-xs text-[#98A2B3]">
          Display order: {member.sortOrder}
        </span>

        <Link
          href={`/admin/departments/${departmentSlug}/members/${member.id}/edit`}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#D0D5DD] bg-white px-4 text-xs font-semibold text-[#344054] transition-colors hover:border-[#D9B66D] hover:bg-[#FFFEFB]"
        >
          Edit member
        </Link>
      </div>
    </article>
  );
}

export default async function AdminDepartmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PageSearchParams>;
}) {
  await connection();

  const access = await getAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (access.status === "forbidden") {
    redirect("/admin/login?error=not_admin");
  }

  const [{ slug }, query, result] = await Promise.all([
    params,
    searchParams,
    getAdminDepartments(),
  ]);

  if (result.kind === "error") {
    return (
      <AdminWorkspace activeSection="departments">
        <main className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8">
          <Link
            href="/admin/departments"
            className="text-sm font-medium text-[#667085] hover:text-[#101B33]"
          >
            ← Back to departments
          </Link>

          <section
            role="alert"
            className="mt-6 rounded-2xl border border-[#F0D4D4] bg-white px-6 py-10"
          >
            <h1 className="text-xl font-semibold text-[#101B33]">
              Department data could not be loaded
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Check the local Supabase instance and your administrator
              session, then try again.
            </p>
            <Link
              href={`/admin/departments/${slug}`}
              className="mt-5 inline-flex min-h-10 items-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white"
            >
              Try again
            </Link>
          </section>
        </main>
      </AdminWorkspace>
    );
  }

  const department = result.departments.find(
    (item) => item.slug === slug,
  );

  if (!department) {
    notFound();
  }

  const validStatuses = ["all", "draft", "published", "archived"];
  const activeStatus = validStatuses.includes(query.status ?? "")
    ? (query.status ?? "all")
    : "all";

  const members = department.members.filter(
    (member) =>
      activeStatus === "all" || member.status === activeStatus,
  );

  const publishedCount = department.members.filter(
    (member) => member.status === "published" && member.isPublic,
  ).length;

  const draftCount = department.members.filter(
    (member) => member.status === "draft",
  ).length;

  const archivedCount = department.members.filter(
    (member) => member.status === "archived",
  ).length;

  return (
    <AdminWorkspace activeSection="departments">
      <div className="mt-4 md:ml-7 ml-5">
        <Link
          href="/admin/departments"
          className="text-sm font-semibold text-[#475467] hover:text-[#101B33]"
        >
          ← Back to all departments
        </Link>
      </div>
      <main className="mx-auto w-full max-w-[1500px] px-5 py-4 sm:px-8 sm:py-9 xl:px-10">
        <nav className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#98A2B3]">
          <Link href="/admin" className="hover:text-[#101B33]">
            Admin
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/admin/departments"
            className="hover:text-[#101B33]"
          >
            Departments
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#475467]">
            {department.name}
          </span>
        </nav>

        <Notice params={query} />

        <header className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                Department workspace
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="break-words text-3xl font-semibold tracking-tight text-[#101B33]">
                  {department.name}
                </h1>
                <StatusPill status={department.status} />
              </div>

              <p className="mt-2 text-sm leading-6 text-[#667085]">
                {department.shortDescription ||
                  "Manage this department's information and member profiles."}
              </p>

              <p className="mt-2 text-xs text-[#98A2B3]">
                Public URL: /departments/{department.slug}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/departments/${department.slug}`}
                target="_blank"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-[#344054] hover:border-[#D9B66D]"
              >
                Preview public page ↗
              </Link>

              <Link
                href={`/admin/departments/${department.slug}/edit`}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white hover:bg-[#263653]"
              >
                Edit department
              </Link>
            </div>
          </div>
        </header>

        <section
          aria-label="Department member statistics"
          className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: "Total members",
              value: department.members.length,
            },
            { label: "Public profiles", value: publishedCount },
            { label: "Draft members", value: draftCount },
            { label: "Archived members", value: archivedCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#E4E7EC] bg-white p-5"
            >
              <p className="text-2xl font-semibold tabular-nums text-[#101B33]">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-[#667085]">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
          <div className="border-b border-[#EAECF0] px-5 py-5 sm:px-6">
            <h2 className="text-base font-semibold text-[#101B33]">
              Department information
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#667085]">
              A quick overview of the information used on the public
              department page.
            </p>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-[#98A2B3]">
                Mission / purpose
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#475467]">
                {department.mission || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#98A2B3]">
                Activities / meetings
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#475467]">
                {department.meetingInformation || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#98A2B3]">
                Department contact
              </p>
              <p className="mt-2 text-sm leading-6 text-[#475467]">
                {department.contactLabel || "No contact button"}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[#101B33]">
                Member profiles
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#667085]">
                Only published profiles approved for public display
                appear on the public website.
              </p>
            </div>
          </div>
        </section>

        <nav
          aria-label="Filter members by publication status"
          className="mb-6 flex flex-wrap gap-2"
        >
          {[
            { value: "all", label: "All members" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Drafts" },
            { value: "archived", label: "Archived" },
          ].map((filter) => {
            const selected = activeStatus === filter.value;

            return (
              <Link
                key={filter.value}
                href={
                  filter.value === "all"
                    ? `/admin/departments/${department.slug}`
                    : `/admin/departments/${department.slug}?status=${filter.value}`
                }
                aria-current={selected ? "page" : undefined}
                className={`inline-flex min-h-9 items-center rounded-full border px-4 text-xs font-semibold transition-colors ${
                  selected
                    ? "border-[#101B33] bg-[#101B33] text-white"
                    : "border-[#D0D5DD] bg-white text-[#475467] hover:border-[#D9B66D]"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>

        {members.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[#D0D5DD] bg-white px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-[#101B33]">
              {department.members.length === 0
                ? "No members added yet"
                : "No members in this filter"}
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#667085]">
              {department.members.length === 0
                ? "Add confirmed members when their details are ready. New profiles remain private drafts until reviewed."
                : "Try another publication-status filter to find the member profiles you're looking for."}
            </p>
          </section>
        ) : (
          <div className="grid items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                departmentSlug={department.slug}
              />
            ))}
          </div>
        )}

        <AddMemberModal
          departmentId={department.id}
          departmentSlug={department.slug}
          departmentName={department.name}
        />
      </main>
    </AdminWorkspace>
  );
}

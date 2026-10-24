import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminDepartments } from "@/lib/admin-department-data";

import { AdminWorkspace } from "../../../../../admin-shell";
import { updateDepartmentMemberAction } from "../../../../actions";
import { MemberPhotoInput } from "../../../../member-photo-input";

export const metadata: Metadata = {
  title: "Edit Department Member | Admin",
};

export const instant = false;

type PageProps = {
  params: Promise<{
    slug: string;
    memberId: string;
  }>;
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
};

const inputClass =
  "mt-2 block w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98A2B3] focus:border-[#B99648] focus:ring-2 focus:ring-[#B99648]/15";

const labelClass = "block text-sm font-semibold text-[#344054]";

function Notice({
  updated,
  error,
}: {
  updated?: string;
  error?: string;
}) {
  if (updated === "member") {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      >
        Member profile saved successfully.
      </div>
    );
  }

  const messages: Record<string, string> = {
    invalid_member: "Please check the member details and try again.",
    member_photo_invalid:
      "That photo format isn't supported. Choose a JPG, PNG, or WebP image.",
    member_photo_too_large:
      "The selected photo exceeds the 5 MB limit. Choose a smaller image.",
    member_photo_upload_failed:
      "The photo couldn't be uploaded. Please try again.",
    member_photo_bucket_missing:
      "The private member-photo storage bucket is not configured correctly.",
    member_photo_not_configured:
      "Member photo storage isn't configured. Contact the site administrator.",
    member_photo_asset_write_failed:
      "The photo was uploaded, but its asset record couldn't be saved.",
    member_save_failed:
      "The member profile couldn't be saved. Please try again.",
  };

  if (!error || !messages[error]) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {messages[error]}
    </div>
  );
}

export default async function EditDepartmentMemberPage({
  params,
  searchParams,
}: PageProps) {
  await connection();

  const [{ slug, memberId }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  const access = await getAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (access.status === "forbidden") {
    redirect("/");
  }

  const result = await getAdminDepartments();

  if (result.kind === "error") {
    return (
      <AdminWorkspace activeSection="departments">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/admin/departments"
            className="text-sm font-semibold text-[#7A6028] hover:text-[#101B33]"
          >
            ← Back to departments
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            We couldn&apos;t load the department members. Refresh the
            page and try again.
          </div>
        </div>
      </AdminWorkspace>
    );
  }

  const department = result.departments.find(
    (item) => item.slug === slug,
  );

  if (!department) {
    notFound();
  }

  const member = department.members.find(
    (item) => item.id === memberId,
  );

  if (!member) {
    notFound();
  }

  return (
    <AdminWorkspace activeSection="departments">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        <Link
          href={`/admin/departments/${department.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6028] transition hover:text-[#101B33]"
        >
          <span aria-hidden="true">←</span>
          Back to {department.name}
        </Link>

        <header className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A772E]">
            Department management
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101B33] sm:text-4xl">
            Edit member
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">
            Manage this member&apos;s profile, photo, display order,
            and publication settings for the {department.name}{" "}
            department.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EAECF0] bg-white p-4">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#F8F4E9] text-sm font-semibold text-[#9A772E]">
            {member.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.photoUrl}
                alt=""
                className="size-11 object-cover"
              />
            ) : (
              member.fullName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("")
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#101B33]">
              {member.fullName}
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              {member.roleTitle || "Department member"} ·{" "}
              {department.name}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              member.status === "published"
                ? "bg-emerald-50 text-emerald-700"
                : member.status === "archived"
                  ? "bg-[#F2F4F7] text-[#475467]"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {member.status}
          </span>
        </div>

        <div className="mt-6">
          <Notice updated={query.updated} error={query.error} />
        </div>

        <form
          action={updateDepartmentMemberAction}
          className="mt-6 space-y-6"
        >
          <input type="hidden" name="memberId" value={member.id} />
          <input
            type="hidden"
            name="departmentId"
            value={department.id}
          />
          <input
            type="hidden"
            name="departmentSlug"
            value={department.slug}
          />

          <section className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm sm:p-7">
            <div className="border-b border-[#EAECF0] pb-5">
              <h2 className="text-lg font-semibold text-[#101B33]">
                Profile information
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#667085]">
                Keep the member&apos;s name, department role, and
                biography accurate and up to date.
              </p>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="fullName">
                  Full name <span className="text-red-600">*</span>
                </label>
                <input
                  className={inputClass}
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  maxLength={160}
                  defaultValue={member.fullName}
                  placeholder="Enter the member's full name"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="roleTitle">
                  Department role
                </label>
                <input
                  className={inputClass}
                  id="roleTitle"
                  name="roleTitle"
                  type="text"
                  maxLength={120}
                  defaultValue={member.roleTitle ?? ""}
                  placeholder="e.g. Choir Director, Usher, Pastor"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="biography">
                  Biography
                </label>
                <textarea
                  className={inputClass}
                  id="biography"
                  name="biography"
                  rows={6}
                  maxLength={5000}
                  defaultValue={member.biography ?? ""}
                  placeholder="Write a short biography, including the member's role and contribution to the department."
                />
                <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                  Share relevant information the member is comfortable
                  making public. Avoid private contact or personal
                  information that isn&apos;t necessary for their
                  profile.
                </p>
              </div>

              <div className="sm:col-span-2">
                <MemberPhotoInput
                  id="member-photo"
                  initialPreview={member.photoUrl}
                />

                {member.photoAssetId && (
                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#EAECF0] p-3.5">
                    <input
                      className="mt-0.5 size-4 accent-[#101B33]"
                      type="checkbox"
                      name="removePhoto"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-[#344054]">
                        Remove current photo
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#667085]">
                        Select this if you want to remove the existing
                        photo without uploading a replacement.
                      </span>
                    </span>
                  </label>
                )}

                <p className="mt-2 text-xs leading-5 text-[#667085]">
                  Uploading a replacement is optional. Supported
                  formats are JPG, PNG, and WebP, with a maximum size
                  of 5 MB.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm sm:p-7">
            <div className="border-b border-[#EAECF0] pb-5">
              <h2 className="text-lg font-semibold text-[#101B33]">
                Visibility and publication
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#667085]">
                Control whether the member profile is eligible to
                appear publicly and how it is ordered within the
                department.
              </p>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  className={labelClass}
                  htmlFor="publicationStatus"
                >
                  Publication status
                </label>
                <select
                  className={inputClass}
                  id="publicationStatus"
                  name="publicationStatus"
                  defaultValue={member.status}
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                  Draft and archived profiles should not appear in the
                  public member listing.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="sortOrder">
                  Display order
                </label>
                <input
                  className={inputClass}
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={9999}
                  step={1}
                  required
                  defaultValue={member.sortOrder}
                />
                <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                  Use a lower number to place this member earlier in
                  the department listing.
                </p>
              </div>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-[#EAECF0] p-4">
              <input
                className="mt-0.5 size-4 accent-[#101B33]"
                type="checkbox"
                name="isPublic"
                value="on"
                defaultChecked={member.isPublic}
              />
              <span>
                <span className="block text-sm font-semibold text-[#344054]">
                  Allow public display
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#667085]">
                  When enabled, this profile can be shown on the
                  public website only if its publication status and
                  parent department also satisfy the existing
                  visibility rules.
                </span>
              </span>
            </label>

            {member.status !== "published" && member.isPublic && (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                Public display is enabled, but this profile is not
                published. It should remain hidden until its
                publication status changes to Published.
              </p>
            )}
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/admin/departments/${department.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#F9FAFB]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#263653] focus:outline-none focus:ring-2 focus:ring-[#B99648] focus:ring-offset-2"
            >
              Save member
            </button>
          </div>
        </form>
      </div>
    </AdminWorkspace>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminDepartments } from "@/lib/admin-department-data";
import { AdminWorkspace } from "../admin-shell";
import {
  createDepartmentMemberAction,
  updateDepartmentAction,
  updateDepartmentMemberAction,
} from "./actions";
import { MemberPhotoInput } from "./member-photo-input";

export const metadata: Metadata = {
  title: "Departments | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

const inputClass =
  "min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30";
const textAreaClass =
  "w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 py-3 text-sm leading-6 text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30";
const labelClass = "mb-2 block text-sm font-semibold text-[#344054]";
const fieldLabel = "block text-xs font-medium text-[#667085]";

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
          <div className="space-y-5">
            {result.departments.map((department) => {
              const publicMembers = department.members.filter(
                (member) =>
                  member.status === "published" && member.isPublic,
              ).length;
              return (
                <section
                  key={department.id}
                  className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_4px_18px_rgba(16,27,51,0.035)]"
                >
                  <div className="flex flex-col gap-3 border-b border-[#EAECF0] bg-[#FCFCFD] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold tracking-tight text-[#101B33]">
                          {department.name}
                        </h2>
                        <StatusPill status={department.status} />
                      </div>
                      <p className="mt-1 text-xs text-[#667085]">
                        /{department.slug} ·{" "}
                        {department.members.length} member profile
                        {department.members.length === 1
                          ? ""
                          : "s"} · {publicMembers} publicly visible
                      </p>
                    </div>
                    <Link
                      href={`/departments/${department.slug}`}
                      target="_blank"
                      className="inline-flex min-h-9 items-center justify-center self-start rounded-full border border-[#D0D5DD] bg-white px-3.5 text-xs font-semibold text-[#475467] hover:border-[#D9B66D] hover:text-[#101B33] sm:self-auto"
                    >
                      Preview public page ↗
                    </Link>
                  </div>

                  <div className="grid gap-7 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                    <form
                      action={updateDepartmentAction}
                      className="space-y-4"
                    >
                      <input
                        type="hidden"
                        name="departmentId"
                        value={department.id}
                      />
                      <input
                        type="hidden"
                        name="slug"
                        value={department.slug}
                      />
                      <div>
                        <label
                          className={labelClass}
                          htmlFor={`${department.slug}-name`}
                        >
                          Department name
                        </label>
                        <input
                          className={inputClass}
                          id={`${department.slug}-name`}
                          name="name"
                          defaultValue={department.name}
                          required
                          maxLength={120}
                        />
                      </div>
                      <div>
                        <label
                          className={labelClass}
                          htmlFor={`${department.slug}-short`}
                        >
                          Short introduction
                        </label>
                        <textarea
                          className={textAreaClass}
                          id={`${department.slug}-short`}
                          name="shortDescription"
                          defaultValue={
                            department.shortDescription ?? ""
                          }
                          rows={2}
                          maxLength={500}
                          placeholder="A concise introduction shown on the directory card."
                        />
                      </div>
                      <div>
                        <label
                          className={labelClass}
                          htmlFor={`${department.slug}-description`}
                        >
                          Department description
                        </label>
                        <textarea
                          className={textAreaClass}
                          id={`${department.slug}-description`}
                          name="description"
                          defaultValue={
                            department.description ?? ""
                          }
                          rows={4}
                          maxLength={5000}
                          placeholder="Explain what the department does. Use only church-approved information."
                        />
                      </div>
                      <div>
                        <label
                          className={labelClass}
                          htmlFor={`${department.slug}-mission`}
                        >
                          Mission / purpose
                        </label>
                        <textarea
                          className={textAreaClass}
                          id={`${department.slug}-mission`}
                          name="mission"
                          defaultValue={department.mission ?? ""}
                          rows={3}
                          maxLength={2000}
                        />
                      </div>
                      <div>
                        <label
                          className={labelClass}
                          htmlFor={`${department.slug}-meeting`}
                        >
                          Activities or meeting information
                        </label>
                        <textarea
                          className={textAreaClass}
                          id={`${department.slug}-meeting`}
                          name="meetingInformation"
                          defaultValue={
                            department.meetingInformation ?? ""
                          }
                          rows={2}
                          maxLength={1000}
                          placeholder="Leave blank until schedule or activities are confirmed."
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            className={labelClass}
                            htmlFor={`${department.slug}-contact-label`}
                          >
                            Contact button label
                          </label>
                          <input
                            className={inputClass}
                            id={`${department.slug}-contact-label`}
                            name="contactLabel"
                            defaultValue={
                              department.contactLabel ?? ""
                            }
                            maxLength={80}
                            placeholder="e.g. Ask about joining"
                          />
                        </div>
                        <div>
                          <label
                            className={labelClass}
                            htmlFor={`${department.slug}-contact-url`}
                          >
                            Contact URL
                          </label>
                          <input
                            className={inputClass}
                            id={`${department.slug}-contact-url`}
                            name="contactUrl"
                            defaultValue={department.contactUrl ?? ""}
                            maxLength={500}
                            placeholder="https://… or mailto:…"
                            inputMode="url"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            className={labelClass}
                            htmlFor={`${department.slug}-order`}
                          >
                            Directory order
                          </label>
                          <input
                            className={inputClass}
                            id={`${department.slug}-order`}
                            name="sortOrder"
                            type="number"
                            min={0}
                            max={99999}
                            step={1}
                            defaultValue={department.sortOrder}
                            required
                          />
                        </div>
                        <div>
                          <label
                            className={labelClass}
                            htmlFor={`${department.slug}-status`}
                          >
                            Publication status
                          </label>
                          <select
                            className={inputClass}
                            id={`${department.slug}-status`}
                            name="publicationStatus"
                            defaultValue={department.status}
                          >
                            <option value="draft">
                              Draft — hidden
                            </option>
                            <option value="published">
                              Published — public
                            </option>
                            <option value="archived">
                              Archived — hidden
                            </option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#263653] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
                      >
                        Save department
                      </button>
                    </form>

                    <div className="min-w-0 border-t border-[#EAECF0] pt-6 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-[#101B33]">
                          Member profiles
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[#667085]">
                          Public visibility requires both Published
                          status and the public-profile checkbox.
                        </p>
                      </div>
                      {department.members.length === 0 ? (
                        <p className="mb-5 rounded-xl border border-dashed border-[#D0D5DD] bg-[#FCFCFD] px-4 py-5 text-sm leading-6 text-[#667085]">
                          No members added yet. Start with confirmed
                          names and keep profiles private until they
                          have approved publication.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {department.members.map((member) => (
                            <form
                              action={updateDepartmentMemberAction}
                              key={member.id}
                              className="rounded-xl border border-[#EAECF0] p-4"
                            >
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                              <input
                                type="hidden"
                                name="departmentId"
                                value={department.id}
                              />
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#667085]">
                                  Member profile
                                </p>
                                <StatusPill status={member.status} />
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <MemberPhotoInput
                                  id={`member-${member.id}-photo`}
                                  initialPreview={member.photoUrl}
                                />
                                <div>
                                  <label
                                    className={fieldLabel}
                                    htmlFor={`member-${member.id}-name`}
                                  >
                                    Full name
                                  </label>
                                  <input
                                    className={`${inputClass} mt-1`}
                                    id={`member-${member.id}-name`}
                                    name="fullName"
                                    defaultValue={member.fullName}
                                    required
                                    maxLength={160}
                                  />
                                </div>
                                <div>
                                  <label
                                    className={fieldLabel}
                                    htmlFor={`member-${member.id}-role`}
                                  >
                                    Role / title
                                  </label>
                                  <input
                                    className={`${inputClass} mt-1`}
                                    id={`member-${member.id}-role`}
                                    name="roleTitle"
                                    defaultValue={
                                      member.roleTitle ?? ""
                                    }
                                    maxLength={120}
                                    placeholder="e.g. Department leader"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label
                                    className={fieldLabel}
                                    htmlFor={`member-${member.id}-bio`}
                                  >
                                    Short biography
                                  </label>
                                  <textarea
                                    className={`${textAreaClass} mt-1`}
                                    id={`member-${member.id}-bio`}
                                    name="biography"
                                    defaultValue={
                                      member.biography ?? ""
                                    }
                                    rows={2}
                                    maxLength={2000}
                                  />
                                </div>
                                <div>
                                  <label
                                    className={fieldLabel}
                                    htmlFor={`member-${member.id}-order`}
                                  >
                                    Display order
                                  </label>
                                  <input
                                    className={`${inputClass} mt-1`}
                                    id={`member-${member.id}-order`}
                                    name="sortOrder"
                                    type="number"
                                    min={0}
                                    max={99999}
                                    step={1}
                                    defaultValue={member.sortOrder}
                                    required
                                  />
                                </div>
                                <div>
                                  <label
                                    className={fieldLabel}
                                    htmlFor={`member-${member.id}-status`}
                                  >
                                    Status
                                  </label>
                                  <select
                                    className={`${inputClass} mt-1`}
                                    id={`member-${member.id}-status`}
                                    name="publicationStatus"
                                    defaultValue={member.status}
                                  >
                                    <option value="draft">
                                      Draft
                                    </option>
                                    <option value="published">
                                      Published
                                    </option>
                                    <option value="archived">
                                      Archived
                                    </option>
                                  </select>
                                </div>
                              </div>
                              {member.photoAssetId && (
                                <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#475467]">
                                  <input
                                    type="checkbox"
                                    name="removePhoto"
                                    className="mt-1 size-4 rounded border-[#D0D5DD] accent-[#101B33]"
                                  />
                                  <span>
                                    Remove current profile picture
                                    (ignored if you choose a
                                    replacement).
                                  </span>
                                </label>
                              )}
                              <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#475467]">
                                <input
                                  type="checkbox"
                                  name="isPublic"
                                  defaultChecked={member.isPublic}
                                  className="mt-1 size-4 rounded border-[#D0D5DD] accent-[#101B33]"
                                />
                                <span>
                                  Approved for public display. Only
                                  enable this if the person has agreed
                                  to have their profile shown on the
                                  church website.
                                </span>
                              </label>
                              <button
                                type="submit"
                                className="mt-4 inline-flex min-h-9 items-center justify-center rounded-full border border-[#D0D5DD] px-4 text-xs font-semibold text-[#344054] hover:border-[#D9B66D] hover:bg-[#FFFEFB]"
                              >
                                Save member
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                      <form
                        action={createDepartmentMemberAction}
                        className="mt-5 rounded-xl border border-[#E9E0CB] bg-[#FBF8F0] p-4"
                      >
                        <input
                          type="hidden"
                          name="departmentId"
                          value={department.id}
                        />
                        <h4 className="text-sm font-semibold text-[#101B33]">
                          Add a member
                        </h4>
                        <p className="mt-1 text-xs leading-5 text-[#667085]">
                          New profiles are created as private drafts
                          and must be reviewed before publication.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <MemberPhotoInput
                            id={`${department.slug}-new-member-photo`}
                          />
                          <div>
                            <label
                              className={fieldLabel}
                              htmlFor={`${department.slug}-new-member-name`}
                            >
                              Full name *
                            </label>
                            <input
                              className={`${inputClass} mt-1`}
                              id={`${department.slug}-new-member-name`}
                              name="fullName"
                              required
                              maxLength={160}
                            />
                          </div>
                          <div>
                            <label
                              className={fieldLabel}
                              htmlFor={`${department.slug}-new-member-role`}
                            >
                              Role / title
                            </label>
                            <input
                              className={`${inputClass} mt-1`}
                              id={`${department.slug}-new-member-role`}
                              name="roleTitle"
                              maxLength={120}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              className={fieldLabel}
                              htmlFor={`${department.slug}-new-member-bio`}
                            >
                              Short biography
                            </label>
                            <textarea
                              className={`${textAreaClass} mt-1`}
                              id={`${department.slug}-new-member-bio`}
                              name="biography"
                              rows={2}
                              maxLength={2000}
                            />
                          </div>
                          <div>
                            <label
                              className={fieldLabel}
                              htmlFor={`${department.slug}-new-member-order`}
                            >
                              Display order
                            </label>
                            <input
                              className={`${inputClass} mt-1`}
                              id={`${department.slug}-new-member-order`}
                              name="sortOrder"
                              type="number"
                              min={0}
                              max={99999}
                              defaultValue={
                                department.members.length + 1
                              }
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#D9B66D] px-4 text-sm font-semibold text-[#101B33] hover:bg-[#E8CC8B]"
                        >
                          Add private draft
                        </button>
                      </form>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </AdminWorkspace>
  );
}

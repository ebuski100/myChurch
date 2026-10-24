// import Link from "next/link";
// import { connection } from "next/server";
// import { notFound, redirect } from "next/navigation";

// import { getAdminAccess } from "@/lib/admin-auth";
// import { getAdminDepartments } from "@/lib/admin-department-data";

// import { AdminWorkspace } from "../../../admin-shell";
// import { updateDepartmentAction } from "../../actions";

// type DepartmentEditPageProps = {
//   params: Promise<{ slug: string }>;
// };

// export default async function DepartmentEditPage({
//   params,
// }: DepartmentEditPageProps) {
//   await connection();

//   const access = await getAdminAccess();
//   if (access.status === "unauthenticated") {
//     redirect("/admin/login");
//   }

//   if (access.status === "forbidden") {
//     redirect("/admin/login?error=not_admin");
//   }

//   const { slug } = await params;
//   const result = await getAdminDepartments();

//   if (result.kind === "error") {
//     return (
//       <AdminWorkspace activeSection="departments">
//         <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
//           <Link
//             href="/admin/departments"
//             className="text-sm font-medium text-amber-700 hover:text-amber-800"
//           >
//             ← Back to departments
//           </Link>

//           <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
//             We couldn’t load the department details. Please refresh
//             the page and try again.
//           </div>
//         </section>
//       </AdminWorkspace>
//     );
//   }

//   const department = result.departments.find(
//     (item) => item.slug === slug,
//   );

//   if (!department) {
//     notFound();
//   }

//   return (
//     <AdminWorkspace activeSection="departments">
//       <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
//         <Link
//           href={`/admin/departments/${department.slug}`}
//           className="text-sm font-medium text-amber-700 transition hover:text-amber-800"
//         >
//           ← Back to {department.name}
//         </Link>

//         <header className="mt-6">
//           <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
//             Department management
//           </p>

//           <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
//             Edit {department.name}
//           </h1>

//           <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
//             Update the department’s information, meeting details,
//             contact information, display order, and publication
//             status.
//           </p>
//         </header>

//         <form
//           action={updateDepartmentAction}
//           className="mt-8 space-y-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
//         >
//           <input
//             type="hidden"
//             name="departmentId"
//             value={department.id}
//           />

//           <input type="hidden" name="slug" value={department.slug} />

//           <section className="space-y-5">
//             <div>
//               <h2 className="text-lg font-semibold text-slate-950">
//                 Basic information
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 The name and descriptions visitors see on the website.
//               </p>
//             </div>

//             <div>
//               <label
//                 htmlFor="name"
//                 className="mb-2 block text-sm font-medium text-slate-700"
//               >
//                 Department name
//               </label>
//               <input
//                 id="name"
//                 name="name"
//                 type="text"
//                 required
//                 maxLength={120}
//                 defaultValue={department.name}
//                 className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="shortDescription"
//                 className="mb-2 block text-sm font-medium text-slate-700"
//               >
//                 Short description
//               </label>
//               <textarea
//                 id="shortDescription"
//                 name="shortDescription"
//                 rows={2}
//                 maxLength={300}
//                 defaultValue={department.shortDescription ?? ""}
//                 placeholder="A concise introduction to this department."
//                 className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="description"
//                 className="mb-2 block text-sm font-medium text-slate-700"
//               >
//                 Full description
//               </label>
//               <textarea
//                 id="description"
//                 name="description"
//                 rows={5}
//                 maxLength={10000}
//                 defaultValue={department.description ?? ""}
//                 placeholder="Explain what the department does and how it serves the church."
//                 className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="mission"
//                 className="mb-2 block text-sm font-medium text-slate-700"
//               >
//                 Mission
//               </label>
//               <textarea
//                 id="mission"
//                 name="mission"
//                 rows={3}
//                 maxLength={5000}
//                 defaultValue={department.mission ?? ""}
//                 placeholder="Describe the department’s purpose and mission."
//                 className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//               />
//             </div>
//           </section>

//           <div className="border-t border-slate-200" />

//           <section className="space-y-5">
//             <div>
//               <h2 className="text-lg font-semibold text-slate-950">
//                 Meetings and contact
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Help members understand when and how to connect with
//                 the department.
//               </p>
//             </div>

//             <div>
//               <label
//                 htmlFor="meetingInformation"
//                 className="mb-2 block text-sm font-medium text-slate-700"
//               >
//                 Meeting information
//               </label>
//               <textarea
//                 id="meetingInformation"
//                 name="meetingInformation"
//                 rows={3}
//                 maxLength={3000}
//                 defaultValue={department.meetingInformation ?? ""}
//                 placeholder="Meeting days, times, location, or other relevant details."
//                 className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//               />
//             </div>

//             <div className="grid gap-5 sm:grid-cols-2">
//               <div>
//                 <label
//                   htmlFor="contactLabel"
//                   className="mb-2 block text-sm font-medium text-slate-700"
//                 >
//                   Contact link label
//                 </label>
//                 <input
//                   id="contactLabel"
//                   name="contactLabel"
//                   type="text"
//                   maxLength={100}
//                   defaultValue={department.contactLabel ?? ""}
//                   placeholder="e.g. Contact the department"
//                   className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="contactUrl"
//                   className="mb-2 block text-sm font-medium text-slate-700"
//                 >
//                   Contact URL
//                 </label>
//                 <input
//                   id="contactUrl"
//                   name="contactUrl"
//                   type="url"
//                   maxLength={2048}
//                   defaultValue={department.contactUrl ?? ""}
//                   placeholder="https://..."
//                   className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//                 />
//               </div>
//             </div>

//             <p className="text-xs leading-5 text-slate-500">
//               Leave both contact fields empty if the department does
//               not need a contact link. If you provide one, enter a
//               complete HTTPS or HTTP URL.
//             </p>
//           </section>

//           <div className="border-t border-slate-200" />

//           <section className="space-y-5">
//             <div>
//               <h2 className="text-lg font-semibold text-slate-950">
//                 Publishing and display
//               </h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Control the department’s visibility and its position
//                 in department listings.
//               </p>
//             </div>

//             <div className="grid gap-5 sm:grid-cols-2">
//               <div>
//                 <label
//                   htmlFor="publicationStatus"
//                   className="mb-2 block text-sm font-medium text-slate-700"
//                 >
//                   Publication status
//                 </label>
//                 <select
//                   id="publicationStatus"
//                   name="publicationStatus"
//                   required
//                   defaultValue={department.status}
//                   className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//                 >
//                   <option value="draft">Draft</option>
//                   <option value="published">Published</option>
//                   <option value="archived">Archived</option>
//                 </select>
//                 <p className="mt-2 text-xs leading-5 text-slate-500">
//                   Only published departments should appear publicly,
//                   subject to the existing publication rules.
//                 </p>
//               </div>

//               <div>
//                 <label
//                   htmlFor="sortOrder"
//                   className="mb-2 block text-sm font-medium text-slate-700"
//                 >
//                   Display order
//                 </label>
//                 <input
//                   id="sortOrder"
//                   name="sortOrder"
//                   type="number"
//                   min={0}
//                   max={10000}
//                   step={1}
//                   required
//                   defaultValue={department.sortOrder}
//                   className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
//                 />
//                 <p className="mt-2 text-xs leading-5 text-slate-500">
//                   Use a smaller number to place this department
//                   earlier in ordered listings.
//                 </p>
//               </div>
//             </div>
//           </section>

//           <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
//             <Link
//               href={`/admin/departments/${department.slug}`}
//               className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//             >
//               Cancel
//             </Link>

//             <button
//               type="submit"
//               className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
//             >
//               Save department
//             </button>
//           </footer>
//         </form>
//       </main>
//     </AdminWorkspace>
//   );
// }

import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";

import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminDepartments } from "@/lib/admin-department-data";

import { AdminWorkspace } from "../../../admin-shell";
import { updateDepartmentAction } from "../../actions";

export const metadata: Metadata = {
  title: "Edit Department | Admin",
};

export const instant = false;

type PageProps = {
  params: Promise<{ slug: string }>;
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
  if (updated === "department") {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      >
        Department details saved successfully.
      </div>
    );
  }

  const messages: Record<string, string> = {
    invalid_department:
      "Please check the department details and try again.",
    contact_pair:
      "Enter both a contact label and a contact URL, or leave both fields empty.",
    contact_url:
      "Enter a valid contact URL using an accepted URL format.",
    save_failed:
      "The department could not be saved. Please try again.",
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

export default async function EditDepartmentPage({
  params,
  searchParams,
}: PageProps) {
  await connection();

  const [{ slug }, query] = await Promise.all([params, searchParams]);

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
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            href="/admin/departments"
            className="text-sm font-semibold text-[#7A6028] hover:text-[#101B33]"
          >
            ← Back to departments
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            We couldn&apos;t load the departments. Refresh the page
            and try again.
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
            Edit department
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">
            Update the department profile, meeting details, contact
            information, and publication status. Changes to
            publication status affect what visitors can see on the
            public website.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#EAECF0] bg-white p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F8F4E9] text-lg font-semibold text-[#9A772E]">
            {department.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#101B33]">
              {department.name}
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              /departments/{department.slug}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              department.status === "published"
                ? "bg-emerald-50 text-emerald-700"
                : department.status === "archived"
                  ? "bg-[#F2F4F7] text-[#475467]"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {department.status}
          </span>
        </div>

        <div className="mt-6">
          <Notice updated={query.updated} error={query.error} />
        </div>

        <form
          action={updateDepartmentAction}
          className="mt-6 space-y-6"
        >
          <input
            type="hidden"
            name="departmentId"
            value={department.id}
          />

          <input type="hidden" name="slug" value={department.slug} />

          <section className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm sm:p-7">
            <div className="border-b border-[#EAECF0] pb-5">
              <h2 className="text-lg font-semibold text-[#101B33]">
                Basic information
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#667085]">
                The name and description help visitors understand the
                department and its purpose.
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className={labelClass} htmlFor="name">
                  Department name{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  className={inputClass}
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  defaultValue={department.name}
                  placeholder="e.g. Choir"
                />
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="shortDescription"
                >
                  Short description
                </label>
                <textarea
                  className={inputClass}
                  id="shortDescription"
                  name="shortDescription"
                  rows={2}
                  maxLength={300}
                  defaultValue={department.shortDescription ?? ""}
                  placeholder="A brief introduction to this department"
                />
                <p className="mt-1.5 text-xs text-[#667085]">
                  Keep this concise for department cards and previews.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="description">
                  Full description
                </label>
                <textarea
                  className={inputClass}
                  id="description"
                  name="description"
                  rows={5}
                  maxLength={5000}
                  defaultValue={department.description ?? ""}
                  placeholder="Describe the department, its work, and how it serves the church."
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="mission">
                  Mission and purpose
                </label>
                <textarea
                  className={inputClass}
                  id="mission"
                  name="mission"
                  rows={4}
                  maxLength={3000}
                  defaultValue={department.mission ?? ""}
                  placeholder="What is this department called to accomplish?"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm sm:p-7">
            <div className="border-b border-[#EAECF0] pb-5">
              <h2 className="text-lg font-semibold text-[#101B33]">
                Meetings and contact
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#667085]">
                Help members and visitors know when the department
                meets and how to make contact.
              </p>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  className={labelClass}
                  htmlFor="meetingInformation"
                >
                  Meeting information
                </label>
                <textarea
                  className={inputClass}
                  id="meetingInformation"
                  name="meetingInformation"
                  rows={3}
                  maxLength={2000}
                  defaultValue={department.meetingInformation ?? ""}
                  placeholder="Meeting days, times, location, or other details"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    className={labelClass}
                    htmlFor="contactLabel"
                  >
                    Contact label
                  </label>
                  <input
                    className={inputClass}
                    id="contactLabel"
                    name="contactLabel"
                    type="text"
                    maxLength={80}
                    defaultValue={department.contactLabel ?? ""}
                    placeholder="e.g. Contact the media team"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="contactUrl">
                    Contact URL
                  </label>
                  <input
                    className={inputClass}
                    id="contactUrl"
                    name="contactUrl"
                    type="url"
                    maxLength={2048}
                    defaultValue={department.contactUrl ?? ""}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <p className="text-xs leading-5 text-[#667085]">
                Provide both contact fields or leave both empty. Use a
                trusted destination, such as the church&apos;s
                official contact page or WhatsApp contact link.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#EAECF0] bg-white p-5 shadow-sm sm:p-7">
            <div className="border-b border-[#EAECF0] pb-5">
              <h2 className="text-lg font-semibold text-[#101B33]">
                Publishing and display
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#667085]">
                Control the department&apos;s visibility and its
                ordering relative to other departments.
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
                  defaultValue={department.status}
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                  Only published departments should be publicly
                  visible, subject to the site&apos;s publication
                  rules.
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
                  defaultValue={department.sortOrder}
                />
                <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                  Lower numbers appear first where departments are
                  sorted by display order.
                </p>
              </div>
            </div>
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
              Save department
            </button>
          </div>
        </form>
      </div>
    </AdminWorkspace>
  );
}

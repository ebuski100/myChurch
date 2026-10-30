// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import type { PublicDepartmentMember } from "@/lib/department-data";

// const BIOGRAPHY_PREVIEW_LIMIT = 50;

// function truncateBiography(text: string | null): string | null {
//   const biography = text?.trim();

//   if (!biography) return null;
//   if (biography.length <= BIOGRAPHY_PREVIEW_LIMIT) return biography;

//   // Reserve three characters for the ellipsis.
//   const maxContentLength = BIOGRAPHY_PREVIEW_LIMIT - 3;
//   const preview = biography.slice(0, maxContentLength);
//   const lastSpace = preview.lastIndexOf(" ");

//   // Avoid cutting a word in half when a reasonable word boundary exists.
//   const cleanPreview =
//     lastSpace >= maxContentLength * 0.75
//       ? preview.slice(0, lastSpace)
//       : preview;

//   return `${cleanPreview.trimEnd()}...`;
// }

// function memberInitials(fullName: string): string {
//   const initials = fullName
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean)
//     .slice(0, 2)
//     .map((part) => part[0] ?? "")
//     .join("")
//     .toUpperCase();

//   return initials || "—";
// }

// export function MemberCard({
//   member,
//   departmentSlug,
// }: {
//   member: PublicDepartmentMember;
//   departmentSlug: string;
// }) {
//   const preview = truncateBiography(member.biography);

//   const profileHref =
//     `/departments/${encodeURIComponent(departmentSlug)}` +
//     `/members/${encodeURIComponent(member.id)}`;

//   return (
//     <li className="h-full min-w-0">
//       <Link
//         href={profileHref}
//         aria-label={`View the profile of ${member.fullName}`}
//         className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E7E9EF] bg-white shadow-[0_5px_20px_rgba(16,27,51,0.045)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#D9B66D]/80 hover:shadow-[0_18px_40px_rgba(16,27,51,0.11)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A772E] motion-reduce:transition-none motion-reduce:hover:transform-none"
//       >
//         {/* Compact member portrait */}
//         <div className="relative h-60 w-full shrink-0 overflow-hidden bg-[#F5F1E8] ">
//           {member.photoUrl ? (
//             <Image
//               src={member.photoUrl}
//               alt={member.fullName}
//               width={600}
//               height={800}
//               unoptimized
//               className="h-full w-full object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:transform-none"
//             />
//           ) : (
//             <div
//               aria-hidden="true"
//               className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#FBF8F0] via-[#F1E8D5] to-[#E7D5AD]"
//             >
//               <span className="grid size-14 place-items-center rounded-full border border-[#D9B66D]/60 bg-white/75 text-lg font-semibold tracking-wide text-[#785B1F] shadow-sm sm:size-16 sm:text-xl">
//                 {memberInitials(member.fullName)}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Member information */}
//         <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
//           <h3 className="break-words text-base font-semibold leading-snug tracking-tight text-[#101B33] transition-colors group-hover:text-[#785B1F] sm:text-lg">
//             {member.fullName}
//           </h3>

//           {preview ? (
//             <p className="mt-2 break-words text-xs leading-[1.7] text-[#667085] sm:text-[13px]">
//               {preview}
//             </p>
//           ) : (
//             <p className="mt-2 text-xs leading-[1.7] text-[#98A2B3] sm:text-[13px]">
//               Discover this member&apos;s profile.
//             </p>
//           )}

//           <span className="mt-auto flex items-center justify-between gap-2 pt-5 text-xs font-semibold text-[#785B1F] sm:text-sm">
//             <span>View profile</span>

//             <span
//               aria-hidden="true"
//               className="grid size-8 shrink-0 place-items-center rounded-full border border-[#E8D9B6] transition-colors duration-200 group-hover:border-[#101B33] group-hover:bg-[#101B33] group-hover:text-white"
//             >
//               <span className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
//                 →
//               </span>
//             </span>
//           </span>
//         </div>
//       </Link>
//     </li>
//   );
// }

"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicDepartmentMember } from "@/lib/department-data";

const BIOGRAPHY_PREVIEW_LIMIT = 70;

function truncateBiography(text: string | null): string | null {
  const biography = text?.trim();

  if (!biography) return null;
  if (biography.length <= BIOGRAPHY_PREVIEW_LIMIT) return biography;

  const maxContentLength = BIOGRAPHY_PREVIEW_LIMIT - 3;
  const preview = biography.slice(0, maxContentLength);
  const lastSpace = preview.lastIndexOf(" ");

  const cleanPreview =
    lastSpace >= maxContentLength * 0.75
      ? preview.slice(0, lastSpace)
      : preview;

  return `${cleanPreview.trimEnd()}...`;
}

function memberInitials(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return initials || "—";
}

function departmentLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function MemberCard({
  member,
  departmentSlug,
}: {
  member: PublicDepartmentMember;
  departmentSlug: string;
}) {
  const preview = truncateBiography(member.biography);

  const profileHref =
    `/departments/${encodeURIComponent(departmentSlug)}` +
    `/members/${encodeURIComponent(member.id)}`;

  return (
    <li className="h-full min-w-0">
      <Link
        href={profileHref}
        aria-label={`View the profile of ${member.fullName}`}
        className="
          group relative flex h-full min-w-0 flex-col
          overflow-hidden rounded-2xl
        
          bg-[#0B1428]
          shadow-[0_12px_35px_rgba(11,20,40,0.10)]
          transition-all duration-300
          hover:-translate-y-1
          hover:border-[#D9B66D]/70
          hover:shadow-[0_22px_45px_rgba(11,20,40,0.18)]
          focus-visible:outline-2
          focus-visible:outline-offset-4
          focus-visible:outline-[#D9B66D]
          motion-reduce:transition-none
          motion-reduce:hover:transform-none
        "
      >
        {/* Portrait */}
        <div className="relative aspect-[4/3.2] w-full shrink-0 overflow-hidden bg-[#17243A]">
          {member.photoUrl ? (
            <Image
              src={member.photoUrl}
              alt={`Portrait of ${member.fullName}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
              className="
                object-cover object-[center_25%]
                transition-transform duration-700
                group-hover:scale-[1.045]
                motion-reduce:transition-none
                motion-reduce:group-hover:transform-none
              "
            />
          ) : (
            <div
              aria-hidden="true"
              className="
                absolute inset-0 grid place-items-center
                bg-[radial-gradient(circle_at_50%_35%,#34435C_0%,#17243A_48%,#0B1428_100%)]
              "
            >
              <span
                className="
                grid size-20 place-items-center rounded-full
                border border-[#D9B66D]/50
                bg-[#D9B66D]/10
                text-2xl font-semibold tracking-wider
                text-[#E8CC8B]
                shadow-[0_0_40px_rgba(217,182,109,0.12)]
              "
              >
                {memberInitials(member.fullName)}
              </span>
            </div>
          )}
        </div>

        {/* Member information */}
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-[#D9B66D]" />
            <span
              className="
              text-[10px] font-semibold uppercase
              tracking-[0.17em] text-[#E8CC8B]
            "
            >
              {departmentLabel(departmentSlug)}
            </span>
          </div>

          <h3
            className="
            break-words text-xl font-semibold
            leading-tight tracking-tight text-white
            transition-colors duration-300
            group-hover:text-[#E8CC8B]
            sm:text-2xl
          "
          >
            {member.fullName}
          </h3>

          <div
            className="
            mt-3 h-px w-10
            bg-gradient-to-r from-[#D9B66D] to-transparent
          "
          />

          <p
            className="
            mt-4 min-h-[4.5rem]
            break-words text-[13px] leading-7
            text-[#B7C2D3]
          "
          >
            {preview ??
              "Discover more about this member and their ministry journey."}
          </p>

          <div
            className="
            mt-auto flex items-center justify-between gap-3
            border-t border-white/10 pt-5
          "
          >
            <span
              className="
              text-[11px] font-semibold uppercase
              tracking-[0.13em] text-[#E8CC8B]
              transition-colors group-hover:text-white
            "
            >
              View profile
            </span>

            <span
              aria-hidden="true"
              className="
                grid size-9 shrink-0 place-items-center rounded-full
                border border-[#D9B66D]/40
                text-[#E8CC8B]
                transition-all duration-300
                group-hover:border-[#D9B66D]
                group-hover:bg-[#D9B66D]
                group-hover:text-[#0B1428]
              "
            >
              <span
                className="
                text-lg transition-transform duration-300
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
              >
                ↗
              </span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

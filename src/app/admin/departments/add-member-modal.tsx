"use client";

import { useEffect, useState } from "react";

import { createDepartmentMemberAction } from "./actions";
import { MemberPhotoInput } from "./member-photo-input";

const inputClass =
  "mt-2 block w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98A2B3] focus:border-[#B99648] focus:ring-2 focus:ring-[#B99648]/15";

const labelClass = "block text-sm font-semibold text-[#344054]";

export function AddMemberModal({
  departmentId,
  departmentSlug,
  departmentName,
}: {
  departmentId: string;
  departmentSlug: string;
  departmentName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full  px-5 py-2.5 text-sm font-semibold  transition  focus:outline-none focus:ring-2 focus:ring-[#B99648] focus:ring-offset-2 mt-5      bg-[#D9B66D]  text-[#101B33] hover:bg-[#E8CC8B] cursor-pointer "
      >
        <span aria-hidden="true" className="text-lg leading-none">
          +
        </span>
        Add member
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#101B33]/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#EAECF0] bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9A772E]">
                  Department management
                </p>
                <h2
                  id="add-member-title"
                  className="mt-2 text-2xl font-semibold tracking-tight text-[#101B33]"
                >
                  Add a member
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Add someone to {departmentName}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close add member dialog"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-[#EAECF0] text-xl text-[#475467] transition hover:bg-[#F9FAFB]"
              >
                ×
              </button>
            </div>

            <form
              action={createDepartmentMemberAction}
              className="space-y-6 p-5 sm:p-7"
            >
              <input
                type="hidden"
                name="departmentId"
                value={departmentId}
              />
              <input
                type="hidden"
                name="departmentSlug"
                value={departmentSlug}
              />

              <div>
                <label
                  className={labelClass}
                  htmlFor="new-member-name"
                >
                  Full name <span className="text-red-600">*</span>
                </label>
                <input
                  className={inputClass}
                  id="new-member-name"
                  name="fullName"
                  type="text"
                  required
                  maxLength={160}
                  placeholder="Enter the member's full name"
                />
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="new-member-role"
                >
                  Department role
                </label>
                <input
                  className={inputClass}
                  id="new-member-role"
                  name="roleTitle"
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Choir Director, Usher, Pastor"
                />
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="new-member-bio"
                >
                  Biography
                </label>
                <textarea
                  className={inputClass}
                  id="new-member-bio"
                  name="biography"
                  rows={4}
                  maxLength={5000}
                  placeholder="Write a brief introduction to this member."
                />
              </div>

              <div>
                <label
                  className={labelClass}
                  htmlFor="new-member-order"
                >
                  Display order
                </label>
                <input
                  className={inputClass}
                  id="new-member-order"
                  name="sortOrder"
                  type="number"
                  min={0}
                  max={9999}
                  step={1}
                  defaultValue={0}
                  required
                />
                <p className="mt-1.5 text-xs text-[#667085]">
                  Lower numbers appear earlier in the member listing.
                </p>
              </div>

              <MemberPhotoInput id="new-member-photo" />

              <p className="rounded-xl bg-[#F8F4E9] px-4 py-3 text-xs leading-5 text-[#71551D]">
                New members are created as private drafts. You can
                review the profile and publish it later from the
                member editor.
              </p>

              <div className="flex flex-col-reverse gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#F9FAFB]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#263653] focus:outline-none focus:ring-2 focus:ring-[#B99648] focus:ring-offset-2"
                >
                  Create member
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

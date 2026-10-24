import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";
import { getAdminSermonForEdit } from "@/lib/admin-sermon-data";
import { formatDuration } from "@/lib/sermons";
import { AdminNotice } from "../../../admin-notice";
import { AdminWorkspace } from "../../../admin-shell";
import { EditSermonForm } from "../../sermon-form";
import { AudioUploadForm } from "./audio-upload-form";
import { AudioDownloadSetting } from "./audio-download-setting";
import { PublicationControls } from "./publication-controls";

export const metadata: Metadata = {
  title: "Edit Sermon | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};
export const instant = false;

export default async function EditAdminSermonPage({
  params,
  searchParams,
}: {
  params: Promise<{ resourceId: string }>;
  searchParams?: Promise<{ created?: string; published?: string }>;
}) {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "forbidden")
    redirect("/admin/login?error=not_admin");

  const { resourceId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      resourceId,
    )
  )
    notFound();
  const result = await getAdminSermonForEdit(resourceId);
  const query = await searchParams;
  if (result.kind === "not_found") notFound();

  return (
    <AdminWorkspace activeSection="sermons">
      <main className="mx-auto w-full max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-7 flex items-center gap-2 text-xs text-[#98A2B3]">
          <Link href="/admin" className="hover:text-[#101B33]">
            Admin
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/admin/sermons"
            className="hover:text-[#101B33]"
          >
            Sermons
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#475467]">Edit</span>
        </div>
        {result.kind === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-[#F0D4D4] bg-white px-6 py-10 text-center"
          >
            <h1 className="text-xl font-semibold text-[#101B33]">
              Sermon could not be loaded
            </h1>
            <p className="mt-2 text-sm text-[#667085]">
              Try again or return to the sermon list.
            </p>
            <Link
              href="/admin/sermons"
              className="mt-5 inline-flex min-h-10 items-center rounded-full bg-[#101B33] px-4 text-sm font-semibold text-white"
            >
              Back to sermons
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                Sermon management · {result.sermon.status}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#101B33]">
                Edit sermon details
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                Metadata changes do not change publication status. Use
                the separate publication controls below.
              </p>
            </header>
            {query?.published === "1" ? (
              <AdminNotice
                message="Sermon published and audio is attached. It is now eligible for the public library."
                kind="success"
                resetKey="published"
                clearQueryParams={{ published: "1", created: "1" }}
                className="mb-5"
              />
            ) : query?.created === "1" ? (
              <AdminNotice
                message="Draft saved. Add or review its private audio below; it remains unpublished until you publish it."
                kind="success"
                resetKey="created"
                clearQueryParams={{ published: "1", created: "1" }}
                className="mb-5"
              />
            ) : null}
            <EditSermonForm sermon={result.sermon}>
              {result.sermon.mediaType === "video" ? (
                <section
                  aria-labelledby="sermon-video-heading"
                  className="mt-5 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-7"
                >
                  <div className="mb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                      Hosted media
                    </p>
                    <h2
                      id="sermon-video-heading"
                      className="mt-1 text-xl font-semibold tracking-tight text-[#101B33]"
                    >
                      YouTube video
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#667085]">
                      The video stays hosted on YouTube. Change the URL in
                      the metadata form above; it is validated on save.
                    </p>
                    <p className="mt-2 break-all text-sm text-[#475467]">
                      Saved source:{" "}
                      <span className="font-semibold">
                        {result.sermon.youtubeUrl ?? "Not set."}
                      </span>
                    </p>
                  </div>
                </section>
              ) : (
                <section
                  aria-labelledby="sermon-audio-heading"
                  className="mt-5 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-7"
                >
                  <div className="mb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
                      Private media
                    </p>
                    <h2
                      id="sermon-audio-heading"
                      className="mt-1 text-xl font-semibold tracking-tight text-[#101B33]"
                    >
                      Sermon audio
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#667085]">
                      Audio is stored privately and remains available to
                      listeners through the existing authorization flow
                      after publication.
                    </p>
                    <p className="mt-2 text-sm text-[#475467]">
                      Saved duration:{" "}
                      <span className="font-semibold">
                        {formatDuration(
                          result.sermon.durationSeconds,
                        ) ??
                          "Not available; detected when audio is uploaded."}
                      </span>
                    </p>
                  </div>
                  <AudioUploadForm
                    resourceId={result.sermon.id}
                    hasAudioAsset={result.sermon.hasAudioAsset}
                    downloadAllowed={result.sermon.downloadAllowed}
                  />
                  <AudioDownloadSetting
                    resourceId={result.sermon.id}
                    hasAudioAsset={result.sermon.hasAudioAsset}
                    downloadAllowed={result.sermon.downloadAllowed}
                  />
                </section>
              )}
              <PublicationControls
                resourceId={result.sermon.id}
                title={result.sermon.title}
                status={result.sermon.status}
                publishedAt={result.sermon.publishedAt}
              />
            </EditSermonForm>
          </>
        )}
      </main>
    </AdminWorkspace>
  );
}

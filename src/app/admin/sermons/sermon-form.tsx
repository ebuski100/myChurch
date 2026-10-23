"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AdminSermonEdit } from "@/lib/admin-sermon-data";
import { AdminNotice } from "../admin-notice";
import {
  createSermonAction,
  updateSermonAction,
  updateSermonAudioDownloadAction,
  type SermonActionState,
} from "./actions";
import {
  changeSermonLifecycleAction,
  publishSermonAction,
} from "./publication-actions";
import {
  getSermonCreationDestination,
  getSermonCreationStep,
  type SermonCreationIntent,
} from "@/lib/sermon-creation-flow";
import { parseLagosScheduleDate } from "@/lib/sermon-lifecycle";
import {
  formatSermonAudioSize,
  MAX_SERMON_AUDIO_BYTES,
  SERMON_AUDIO_ACCEPT,
  uploadSermonAudio,
  useSermonAudioMetadata,
  validateSelectedSermonAudio,
} from "./audio-upload-client";

const initialState: SermonActionState = {};

function Field({
  name,
  label,
  value,
  error,
  type = "text",
  required = false,
  maxLength,
}: {
  name: string;
  label: string;
  value?: string | number | null;
  error?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const id = `sermon-${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#344054]"
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={value ?? ""}
        required={required}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 text-sm text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30 aria-[invalid=true]:border-[#B54747]"
      />
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1.5 text-xs text-[#B54747]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function SermonFields({
  initial,
  state,
  pending,
  showFooter = true,
}: {
  initial?: AdminSermonEdit;
  state: SermonActionState;
  pending: boolean;
  showFooter?: boolean;
}) {
  const errors = state.errors ?? {};
  return (
    <>
      {state.message && (
        <AdminNotice
          message={state.message}
          kind={state.resourceId ? "success" : "error"}
          resetKey={state}
          persistent={Boolean(state.errors)}
        />
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            name="title"
            label="Title"
            value={initial?.title}
            error={errors.title}
            required
            maxLength={200}
          />
        </div>
        <Field
          name="preacher"
          label="Speaker"
          value={initial?.preacher}
          error={errors.preacher}
          maxLength={200}
        />
        <Field
          name="sermonDate"
          label="Sermon date"
          value={initial?.sermonDate}
          error={errors.sermonDate}
          type="date"
        />
        <Field
          name="series"
          label="Series"
          value={initial?.series}
          error={errors.series}
          maxLength={200}
        />
        <div className="sm:col-span-2">
          <label
            htmlFor="sermon-description"
            className="mb-2 block text-sm font-semibold text-[#344054]"
          >
            Description
          </label>
          <textarea
            id="sermon-description"
            name="description"
            defaultValue={initial?.description ?? ""}
            maxLength={5000}
            rows={5}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description
                ? "sermon-description-error"
                : undefined
            }
            className="w-full rounded-xl border border-[#D0D5DD] bg-white px-3.5 py-3 text-sm leading-6 text-[#101B33] outline-none focus:border-[#9A772E] focus:ring-2 focus:ring-[#D9B66D]/30 aria-[invalid=true]:border-[#B54747]"
          />
          {errors.description && (
            <p
              id="sermon-description-error"
              className="mt-1.5 text-xs text-[#B54747]"
            >
              {errors.description}
            </p>
          )}
        </div>
      </div>
      {showFooter && (
        <div className="flex flex-col-reverse gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:justify-end">
          <Link
            href="/admin/sermons"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#475467] hover:bg-[#F8F9FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            {pending
              ? "Saving…"
              : initial
                ? "Save changes"
                : "Create draft sermon"}
          </button>
        </div>
      )}
    </>
  );
}

export function CreateSermonForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const intentRef = useRef<SermonCreationIntent>("draft");
  const [pendingIntent, setPendingIntent] =
    useState<SermonCreationIntent>("draft");
  const [state, setState] = useState<SermonActionState>(initialState);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [audioAttached, setAudioAttached] = useState(false);
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [savedDownloadAllowed, setSavedDownloadAllowed] = useState<
    boolean | null
  >(null);
  const [pending, setPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const audioMetadata = useSermonAudioMetadata(selectedFile);
  const [durationWarning, setDurationWarning] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "warning" | "error";
    message: string;
    persistent?: boolean;
  } | null>(null);
  const [scheduled, setScheduled] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    const intent = intentRef.current;
    const file = audioInputRef.current?.files?.[0] ?? null;
    const step = getSermonCreationStep({
      intent,
      resourceId: draftId,
      fileSelected: Boolean(file),
      audioAttached,
      downloadSettingSaved:
        audioAttached && savedDownloadAllowed === downloadAllowed,
    });

    if (step === "missing_audio") {
      setFeedback({
        kind: "error",
        message:
          "Choose an audio recording before publishing or scheduling this sermon.",
        persistent: true,
      });
      audioInputRef.current?.focus();
      return;
    }
    if (intent === "publish" && !confirmationRef.current?.checked) {
      setFeedback({
        kind: "error",
        message:
          "Confirm that this sermon is ready for the public library before publishing.",
        persistent: true,
      });
      confirmationRef.current?.focus();
      return;
    }
    if (intent === "schedule") {
      const form = formRef.current;
      const scheduleResult = parseLagosScheduleDate(
        form ? new FormData(form).get("scheduledAt") : null,
      );
      if (!scheduleResult.ok) {
        setFeedback({
          kind: "error",
          message:
            scheduleResult.reason === "not_future"
              ? "Choose a future publication date and time in Africa/Lagos."
              : "Enter a valid publication date and time in Africa/Lagos.",
          persistent: true,
        });
        (
          form?.elements.namedItem(
            "scheduledAt",
          ) as HTMLInputElement | null
        )?.focus();
        return;
      }
      if (!confirmationRef.current?.checked) {
        setFeedback({
          kind: "error",
          message:
            "Confirm that the sermon should remain private until its scheduled time.",
          persistent: true,
        });
        confirmationRef.current?.focus();
        return;
      }
    }
    if (step === "draft_saved") {
      if (draftId)
        router.replace(getSermonCreationDestination(intent));
      return;
    }

    if (file) {
      if (
        audioMetadata.status === "loading" ||
        audioMetadata.status === "idle"
      ) {
        setFeedback({
          kind: "error",
          message:
            "Wait for audio duration detection to finish before uploading.",
          persistent: true,
        });
        return;
      }
      const fileProblem = validateSelectedSermonAudio(file);
      if (fileProblem) {
        setFeedback({
          kind: "error",
          message: fileProblem,
          persistent: true,
        });
        return;
      }
    }

    busyRef.current = true;
    setPending(true);
    setFeedback(null);
    setState(initialState);
    try {
      let durationWarningOccurred = durationWarning;
      let currentDraftId = draftId;
      if (step === "create_draft") {
        const form = formRef.current;
        if (!form) return;
        const created = await createSermonAction(
          initialState,
          new FormData(form),
        );
        setState(created);
        if (created.errors || !created.resourceId) {
          if (!created.message)
            setFeedback({
              kind: "error",
              message:
                "The draft could not be created. Please try again.",
            });
          return;
        }
        currentDraftId = created.resourceId;
        setDraftId(currentDraftId);
        if (!file && intent === "draft") {
          router.replace(getSermonCreationDestination("draft"));
          return;
        }
      }

      if (!currentDraftId) {
        setFeedback({
          kind: "error",
          message:
            "The saved draft could not be identified. Open the sermon list and try again.",
        });
        return;
      }

      if (file && !audioAttached) {
        setUploadProgress(0);
        const upload = await uploadSermonAudio(
          currentDraftId,
          file,
          audioMetadata.durationSeconds,
          setUploadProgress,
        );
        setUploadProgress(null);
        if (!upload.ok) {
          setFeedback({
            kind: "error",
            message: `${upload.message} Your draft and metadata are saved; select the file and retry.`,
            persistent: true,
          });
          return;
        }
        setAudioAttached(true);
        setSavedDownloadAllowed(null);
        setSelectedFile(null);
        if (upload.durationWarning) {
          durationWarningOccurred = true;
          setDurationWarning(true);
        }
        if (audioInputRef.current) audioInputRef.current.value = "";
        router.refresh();
      }

      if (audioAttached || file) {
        const permissionForm = new FormData();
        permissionForm.set(
          "downloadAllowed",
          String(downloadAllowed),
        );
        const permission = await updateSermonAudioDownloadAction(
          currentDraftId,
          {},
          permissionForm,
        );
        if (!permission.success) {
          setFeedback({
            kind: "error",
            message: `${permission.message ?? "The download setting could not be saved."} The draft and its attached audio are available for retry; it was not published.`,
          });
          return;
        }
        setSavedDownloadAllowed(downloadAllowed);
      }

      if (uploadProgress !== null) setUploadProgress(null);

      if (intent === "draft") {
        router.replace(
          getSermonCreationDestination(
            "draft",
            durationWarningOccurred,
          ),
        );
        return;
      }

      if (intent === "schedule") {
        const form = formRef.current;
        const scheduledAt = form
          ? new FormData(form).get("scheduledAt")
          : null;
        const lifecycleForm = new FormData();
        lifecycleForm.set("command", "schedule");
        lifecycleForm.set("confirmation", "yes");
        if (typeof scheduledAt === "string")
          lifecycleForm.set("scheduledAt", scheduledAt);
        const result = await changeSermonLifecycleAction(
          currentDraftId,
          {},
          lifecycleForm,
        );
        if (!result.success) {
          setFeedback({
            kind: "error",
            message: `${result.message ?? "The sermon could not be scheduled."} Your draft and audio are saved and can be retried.`,
          });
          return;
        }
        setFeedback({
          kind: "success",
          message: result.message ?? "Sermon scheduled.",
        });
        setScheduled(true);
        router.replace(
          getSermonCreationDestination(
            "schedule",
            durationWarningOccurred,
          ),
        );
        return;
      }

      const publicationForm = new FormData();
      publicationForm.set("command", "publish");
      publicationForm.set("confirmation", "yes");
      const publication = await publishSermonAction(
        currentDraftId,
        {},
        publicationForm,
      );
      if (!publication.success) {
        setFeedback({
          kind: "error",
          message: `${publication.message ?? "The sermon could not be published."} The saved draft and attached audio are available for retry.`,
        });
        return;
      }
      setFeedback({
        kind: "success",
        message: publication.message ?? "Sermon published.",
      });
      setState({ resourceId: currentDraftId });
      setPublished(true);
      router.replace(
        getSermonCreationDestination(
          "publish",
          durationWarningOccurred,
        ),
      );
    } catch {
      setUploadProgress(null);
      setFeedback({
        kind: "error",
        message:
          "The workflow could not be completed. Any saved draft remains available in the sermon list.",
      });
    } finally {
      busyRef.current = false;
      intentRef.current = "draft";
      setPendingIntent("draft");
      setPending(false);
    }
  }

  const [published, setPublished] = useState(false);
  const formLocked = Boolean(draftId) || pending;

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-5">
      <fieldset
        disabled={formLocked}
        className="space-y-5 disabled:opacity-90"
      >
        <section
          aria-labelledby="create-sermon-details-heading"
          className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-7"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
            Section 1
          </p>
          <h2
            id="create-sermon-details-heading"
            className="mb-5 mt-1 text-xl font-semibold tracking-tight text-[#101B33]"
          >
            Sermon details
          </h2>
          <SermonFields
            state={state}
            pending={pending}
            showFooter={false}
          />
        </section>
      </fieldset>

      <section
        aria-labelledby="create-sermon-audio-heading"
        className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-7"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
          Section 2 · Private media
        </p>
        <h2
          id="create-sermon-audio-heading"
          className="mb-2 mt-1 text-xl font-semibold tracking-tight text-[#101B33]"
        >
          Sermon audio
        </h2>
        <p className="mb-5 text-sm leading-6 text-[#667085]">
          Audio is uploaded to the private sermon bucket. The server
          checks its file signature and size; the browser MIME type is
          not used for authorization.
        </p>
        <label
          htmlFor="new-sermon-audio"
          className="mb-2 block text-sm font-semibold text-[#344054]"
        >
          Choose an audio recording
        </label>
        <input
          ref={audioInputRef}
          id="new-sermon-audio"
          type="file"
          accept={SERMON_AUDIO_ACCEPT}
          disabled={pending || audioAttached}
          onChange={(event) =>
            setSelectedFile(event.currentTarget.files?.[0] ?? null)
          }
          aria-describedby="new-sermon-audio-help"
          className="block min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#344054] file:mr-4 file:rounded-full file:border-0 file:bg-[#F4F0E7] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#765A22] disabled:opacity-60"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-[#344054]">
            Selected: <strong>{selectedFile.name}</strong> ·{" "}
            {formatSermonAudioSize(selectedFile.size)}
          </p>
        )}
        {selectedFile && audioMetadata.status === "loading" && (
          <p role="status" className="mt-2 text-sm text-[#667085]">
            Reading audio metadata…
          </p>
        )}
        {selectedFile &&
          audioMetadata.status === "ready" &&
          audioMetadata.preview && (
            <p role="status" className="mt-2 text-sm text-[#3C704B]">
              Detected duration: {audioMetadata.preview}
            </p>
          )}
        {selectedFile && audioMetadata.status === "error" && (
          <p role="status" className="mt-2 text-sm text-[#765A22]">
            Duration could not be read from this file. Upload may
            continue; the saved duration will be left unchanged.
          </p>
        )}
        <p
          id="new-sermon-audio-help"
          className="mt-2 text-xs leading-5 text-[#667085]"
        >
          MP3, MP4/M4A, AAC, OGG, WAV, WebM, or FLAC. Maximum size:{" "}
          {formatSermonAudioSize(MAX_SERMON_AUDIO_BYTES)}. A draft can
          be saved before audio is attached.
        </p>
        <label
          htmlFor="new-sermon-download-allowed"
          className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-semibold leading-6 text-[#344054]"
        >
          <input
            id="new-sermon-download-allowed"
            type="checkbox"
            checked={downloadAllowed}
            onChange={(event) =>
              setDownloadAllowed(event.currentTarget.checked)
            }
            disabled={pending || (!selectedFile && !audioAttached)}
            aria-describedby="new-sermon-download-help"
            className="mt-1 size-4 accent-[#9A772E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] disabled:cursor-not-allowed"
          />
          <span>Allow official audio downloads</span>
        </label>
        <p
          id="new-sermon-download-help"
          className="ml-7 mt-1 text-xs leading-5 text-[#667085]"
        >
          Enabling this permits downloads through the authorized
          download flow. The audio remains private and this setting
          does not bypass authorization.
        </p>
        {audioAttached && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-[#CFE7D6] bg-[#F4FBF6] px-4 py-3 text-sm text-[#2F6B42]"
          >
            Private audio is attached to this draft.
          </p>
        )}
        {audioAttached && savedDownloadAllowed !== null && (
          <p className="mt-2 text-xs text-[#667085]">
            Saved download setting:{" "}
            {savedDownloadAllowed ? "enabled" : "disabled"}.
          </p>
        )}
        {uploadProgress !== null && (
          <div className="mt-4 space-y-2" aria-live="polite">
            <div className="flex justify-between text-xs text-[#667085]">
              <span>Uploading private audio</span>
              <span>{uploadProgress}%</span>
            </div>
            <progress
              aria-label="Audio upload progress"
              max={100}
              value={uploadProgress}
              className="h-2 w-full accent-[#9A772E]"
            />
          </div>
        )}
      </section>

      <section
        aria-labelledby="create-sermon-submit-heading"
        className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-7"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
          Section 3
        </p>
        <h2
          id="create-sermon-submit-heading"
          className="mt-1 text-xl font-semibold tracking-tight text-[#101B33]"
        >
          Save or publish
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Saving creates a private draft. Publishing or scheduling
          rechecks the saved audio on the server.
        </p>
        <div className="mt-4 max-w-sm">
          <label
            htmlFor="new-sermon-scheduled-at"
            className="mb-2 block text-sm font-semibold text-[#344054]"
          >
            Schedule publication (Africa/Lagos, WAT)
          </label>
          <input
            id="new-sermon-scheduled-at"
            name="scheduledAt"
            type="datetime-local"
            disabled={pending || scheduled}
            className="min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#101B33] focus:border-[#9A772E] focus:outline-none focus:ring-2 focus:ring-[#D9B66D]/30 disabled:opacity-60"
          />
          <p className="mt-1 text-xs leading-5 text-[#667085]">
            The sermon remains private until a configured scheduler
            processes it.
          </p>
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#344054]">
          <input
            ref={confirmationRef}
            type="checkbox"
            disabled={pending || published || scheduled}
            className="mt-1 size-4 accent-[#9A772E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] disabled:cursor-not-allowed"
          />
          <span>
            {pendingIntent === "schedule"
              ? "I confirm this sermon and audio are ready, and it should remain private until the scheduled time."
              : "I confirm this sermon and its audio are ready for the public sermon library."}
          </span>
        </label>
        {feedback && (
          <AdminNotice
            message={feedback.message}
            kind={feedback.kind}
            resetKey={feedback}
            persistent={feedback.persistent}
            className="mt-4"
          />
        )}
        {draftId && (
          <p className="mt-3 text-sm text-[#667085]">
            This saved draft remains in the sermon list if you leave
            this page.{" "}
            <Link
              href={`/admin/sermons/${draftId}/edit`}
              className="font-semibold text-[#765A22] underline underline-offset-2"
            >
              Open draft
            </Link>
          </p>
        )}
        {published && (
          <p className="mt-3 text-sm">
            <Link
              href="/sermons"
              className="font-semibold text-[#765A22] underline underline-offset-2"
            >
              View the public sermon library
            </Link>
          </p>
        )}
        {scheduled && (
          <p className="mt-3 text-sm text-[#435A82]">
            Scheduled sermons remain private until the scheduler
            processes them.
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:justify-end">
          <Link
            href="/admin/sermons"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#475467] hover:bg-[#F8F9FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            Sermon list
          </Link>
          <button
            type="submit"
            disabled={pending || published || scheduled}
            onClick={() => {
              intentRef.current = "draft";
              setPendingIntent("draft");
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] hover:bg-[#F8F9FB] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            {pending && pendingIntent === "draft"
              ? "Saving…"
              : draftId && !selectedFile && !audioAttached
                ? "Open saved draft"
                : "Save to Draft"}
          </button>
          <button
            type="submit"
            disabled={pending || published || scheduled}
            onClick={() => {
              intentRef.current = "publish";
              setPendingIntent("publish");
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#9A772E] px-5 text-sm font-semibold text-white hover:bg-[#765A22] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            {pending && pendingIntent === "publish"
              ? "Publishing…"
              : "Publish Sermon"}
          </button>
          <button
            type="submit"
            disabled={pending || published || scheduled}
            onClick={() => {
              intentRef.current = "schedule";
              setPendingIntent("schedule");
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#D9E2F2] bg-[#F3F6FC] px-5 text-sm font-semibold text-[#435A82] hover:bg-[#E8EDF8] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
          >
            {pending && pendingIntent === "schedule"
              ? "Scheduling…"
              : "Schedule Sermon"}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          {pending ? "Saving sermon and uploading audio" : ""}
        </span>
      </section>
    </form>
  );
}

export function EditSermonForm({
  sermon,
  children,
}: {
  sermon: AdminSermonEdit;
  children: ReactNode;
}) {
  const updateAction = updateSermonAction.bind(null, sermon.id);
  const [state, action, pending] = useActionState(
    updateAction,
    initialState,
  );
  const formId = `edit-sermon-metadata-${sermon.id}`;
  return (
    <>
      <section className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_5px_22px_rgba(16,27,51,0.035)] sm:p-7">
        <form id={formId} action={action} className="space-y-5">
          <SermonFields
            initial={sermon}
            state={state}
            pending={pending}
            showFooter={false}
          />
          <div className="sr-only" aria-live="polite">
            {pending ? "Saving sermon" : ""}
          </div>
        </form>
      </section>
      {children}
      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#EAECF0] pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/admin/sermons"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#475467] hover:bg-[#F8F9FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
        >
          Cancel
        </Link>
        <button
          type="submit"
          form={formId}
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </>
  );
}

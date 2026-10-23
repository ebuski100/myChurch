"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AdminNotice } from "../../../admin-notice";
import {
  formatSermonAudioSize,
  MAX_SERMON_AUDIO_BYTES,
  SERMON_AUDIO_ACCEPT,
  uploadSermonAudio,
  useSermonAudioMetadata,
  validateSelectedSermonAudio,
} from "../../audio-upload-client";

export function AudioUploadForm({
  resourceId,
  hasAudioAsset,
  downloadAllowed,
}: {
  resourceId: string;
  hasAudioAsset: boolean;
  downloadAllowed: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<
    "success" | "warning" | "error" | ""
  >("");
  const [progress, setProgress] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const audioMetadata = useSermonAudioMetadata(selectedFile);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setMessageKind("error");
      setMessage("Choose an audio file first.");
      return;
    }
    if (
      audioMetadata.status === "loading" ||
      audioMetadata.status === "idle"
    ) {
      setMessageKind("error");
      setMessage(
        "Wait for audio duration detection to finish before uploading.",
      );
      return;
    }
    const fileProblem = validateSelectedSermonAudio(file);
    if (fileProblem) {
      setMessageKind("error");
      setMessage(fileProblem);
      return;
    }

    setPending(true);
    setMessage("Uploading audio…");
    setMessageKind("");
    try {
      setProgress(0);
      const result = await uploadSermonAudio(
        resourceId,
        file,
        audioMetadata.durationSeconds,
        setProgress,
      );
      setProgress(null);
      if (!result.ok) {
        setMessageKind("error");
        setMessage(result.message);
        return;
      }
      setMessageKind(
        result.cleanupWarning || result.durationWarning
          ? "warning"
          : "success",
      );
      setMessage(
        result.message ||
          "Audio uploaded and attached to this sermon.",
      );
      if (inputRef.current) inputRef.current.value = "";
      setSelectedFile(null);
      router.refresh();
    } catch {
      setProgress(null);
      setMessageKind("error");
      setMessage(
        "The audio upload could not be completed. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#101B33]">
          {hasAudioAsset
            ? "Audio recording attached"
            : "No audio recording attached"}
        </p>
        <p className="mt-1 text-sm leading-6 text-[#667085]">
          {hasAudioAsset
            ? `Uploading a replacement keeps the current recording active until the new file is attached. Official downloads are ${downloadAllowed ? "enabled" : "disabled"} for this sermon.`
            : "A new recording is attached with official downloads disabled. The private file location is never shown here."}
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label
            htmlFor="sermon-audio-file"
            className="mb-2 block text-sm font-semibold text-[#344054]"
          >
            {hasAudioAsset
              ? "Choose replacement audio"
              : "Choose audio file"}
          </label>
          <input
            ref={inputRef}
            id="sermon-audio-file"
            type="file"
            accept={SERMON_AUDIO_ACCEPT}
            disabled={pending}
            onChange={(event) =>
              setSelectedFile(event.currentTarget.files?.[0] ?? null)
            }
            aria-describedby="sermon-audio-help"
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
              <p
                role="status"
                className="mt-2 text-sm text-[#3C704B]"
              >
                Detected duration: {audioMetadata.preview}
              </p>
            )}
          {selectedFile && audioMetadata.status === "error" && (
            <p role="status" className="mt-2 text-sm text-[#765A22]">
              Duration could not be read from this file. Upload may
              continue; the existing saved duration will be left
              unchanged.
            </p>
          )}
          <p
            id="sermon-audio-help"
            className="mt-2 text-xs leading-5 text-[#667085]"
          >
            MP3, MP4/M4A, AAC, OGG, WAV, WebM, or FLAC. Maximum size:{" "}
            {formatSermonAudioSize(MAX_SERMON_AUDIO_BYTES)}. The
            server checks the file signature as well as the filename.
          </p>
        </div>
        {progress !== null && (
          <div className="space-y-2" aria-live="polite">
            <div className="flex justify-between text-xs text-[#667085]">
              <span>Uploading audio</span>
              <span>{progress}%</span>
            </div>
            <progress
              aria-label="Audio upload progress"
              max={100}
              value={progress}
              className="h-2 w-full accent-[#9A772E]"
            />
          </div>
        )}
        {message &&
          (messageKind ? (
            <AdminNotice
              message={message}
              kind={messageKind}
              resetKey={`${messageKind}:${message}`}
              persistent={messageKind === "error"}
            />
          ) : (
            <p
              role="status"
              aria-live="polite"
              className="rounded-xl border border-[#CFE7D6] bg-[#F4FBF6] px-4 py-3 text-sm text-[#2F6B42]"
            >
              {message}
            </p>
          ))}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#101B33] px-5 text-sm font-semibold text-white hover:bg-[#263653] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
        >
          {pending
            ? "Uploading audio…"
            : hasAudioAsset
              ? "Upload replacement audio"
              : "Upload audio"}
        </button>
        <span className="sr-only" aria-live="polite">
          {pending ? "Audio upload in progress" : ""}
        </span>
      </form>
    </div>
  );
}

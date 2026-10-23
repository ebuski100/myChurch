"use client";

import { useEffect, useRef, useState } from "react";
import { AdminNotice } from "../admin-notice";
import {
  MAX_EVENT_IMAGE_BYTES,
  validateEventImageUpload,
} from "@/lib/event-image-validation";

type UploadNotice = {
  kind: "success" | "warning" | "error";
  message: string;
};

type PosterUploadResponse = {
  ok: boolean;
  message?: string;
  cleanupWarning?: boolean;
  assetId?: string;
  imageUrl?: string;
};

export function EventPosterUpload({
  title,
  posterAssetId,
  posterUrl,
}: {
  title: string;
  posterAssetId: string | null;
  posterUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initialAssetId = useRef(posterAssetId);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [uploadedToken, setUploadedToken] = useState<string | null>(
    null,
  );
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<
    string | null
  >(null);
  const [currentAssetId, setCurrentAssetId] = useState(posterAssetId);
  const [currentPosterUrl, setCurrentPosterUrl] = useState(posterUrl);
  const [notice, setNotice] = useState<UploadNotice | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current)
        URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  async function deleteStagedPoster(
    assetId: string,
  ): Promise<boolean> {
    const response = await fetch("/api/admin/events/poster", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId }),
    });
    return response.ok;
  }

  async function uploadPoster() {
    if (pending) return;
    const file = selectedFile;
    if (!file || file.size === 0) {
      setNotice({
        kind: "error",
        message: "Choose an event poster image first.",
      });
      return;
    }

    const token = uploadToken ?? crypto.randomUUID();
    if (!uploadToken) setUploadToken(token);
    const prefix = new Uint8Array(
      await file.slice(0, 12).arrayBuffer(),
    );
    const validation = validateEventImageUpload(
      file.name,
      file.size,
      prefix,
    );
    if (!validation.ok) {
      setNotice({
        kind: "error",
        message:
          validation.reason === "invalid_size"
            ? "Choose an image no larger than 5 MiB."
            : validation.reason === "invalid_filename"
              ? "Choose an image with a valid filename."
              : "Choose a valid JPG, PNG, or WebP image.",
      });
      return;
    }

    setPending(true);
    setProgress(0);
    setNotice(null);
    try {
      const result = await new Promise<PosterUploadResponse>(
        (resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("POST", "/api/admin/events/poster");
          request.setRequestHeader(
            "x-event-image-file-name",
            encodeURIComponent(file.name),
          );
          request.setRequestHeader(
            "x-event-image-file-size",
            String(file.size),
          );
          request.setRequestHeader(
            "x-event-image-upload-token",
            token,
          );
          request.upload.addEventListener(
            "progress",
            (uploadEvent) => {
              if (uploadEvent.lengthComputable) {
                setProgress(
                  Math.round(
                    (uploadEvent.loaded / uploadEvent.total) * 100,
                  ),
                );
              }
            },
          );
          request.addEventListener("load", () => {
            let response: Omit<PosterUploadResponse, "ok">;
            try {
              response = JSON.parse(
                request.responseText,
              ) as typeof response;
            } catch {
              reject(new Error("Invalid poster upload response."));
              return;
            }
            resolve({
              ...response,
              ok: request.status >= 200 && request.status < 300,
            });
          });
          request.addEventListener("error", () =>
            reject(new Error("Poster upload failed.")),
          );
          request.addEventListener("abort", () =>
            reject(new Error("Poster upload was cancelled.")),
          );
          request.send(file);
        },
      );
      setProgress(null);
      if (!result.ok) {
        setNotice({
          kind: "error",
          message:
            result.message ??
            "The event image could not be uploaded. Try again.",
        });
        return;
      }
      if (!result.assetId || !result.imageUrl) {
        setNotice({
          kind: "error",
          message:
            "The poster uploaded but could not be prepared. Retry the upload.",
        });
        return;
      }
      const previousAssetId = currentAssetId;
      setCurrentAssetId(result.assetId);
      setCurrentPosterUrl(result.imageUrl);
      setUploadedToken(token);
      setNotice({
        kind: "success",
        message: result.message ?? "Event image uploaded.",
      });
      if (
        previousAssetId &&
        previousAssetId !== initialAssetId.current &&
        previousAssetId !== result.assetId
      ) {
        const removed = await deleteStagedPoster(previousAssetId);
        if (!removed) {
          setNotice({
            kind: "warning",
            message:
              "The new poster is ready, but the replaced temporary image could not be removed.",
          });
        }
      }
    } catch {
      setProgress(null);
      setNotice({
        kind: "error",
        message:
          "The event image upload could not be completed. Check your connection and try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function removePoster() {
    if (pending || (!currentAssetId && !selectedFile)) return;
    if (currentAssetId && currentAssetId !== initialAssetId.current) {
      setPending(true);
      try {
        const removed = await deleteStagedPoster(currentAssetId);
        if (!removed) {
          setNotice({
            kind: "error",
            message:
              "The uploaded poster could not be removed. Retry or keep it attached.",
          });
          return;
        }
      } catch {
        setNotice({
          kind: "error",
          message:
            "The uploaded poster could not be removed. Check your connection and retry.",
        });
        return;
      } finally {
        setPending(false);
      }
    }
    setCurrentAssetId(null);
    setCurrentPosterUrl(null);
    setSelectedFile(null);
    setUploadToken(null);
    setUploadedToken(null);
    setNotice(null);
    if (previewUrlRef.current)
      URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setSelectedPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function updateSelectedFile(file: File | null) {
    if (previewUrlRef.current)
      URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setSelectedPreviewUrl(previewUrlRef.current);
    setSelectedFile(file);
    setUploadToken(file ? crypto.randomUUID() : null);
    setUploadedToken(null);
    setNotice(null);
  }

  const previewUrl = selectedPreviewUrl ?? currentPosterUrl;

  return (
    <div className="mt-6 border-t border-[#EAECF0] pt-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A772E]">
        Private media
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#101B33]">
        Event poster
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        JPG, PNG, or WebP, up to{" "}
        {Math.round(MAX_EVENT_IMAGE_BYTES / (1024 * 1024))} MiB.
        Poster files stay private and are signed for published events
        only.
      </p>
      {previewUrl && (
        <div
          role="img"
          aria-label={`${selectedPreviewUrl ? "Selected" : "Current"} poster for ${title}`}
          className="mt-4 aspect-[16/9] max-w-lg rounded-xl border border-[#E4E7EC] bg-cover bg-center"
          style={{
            backgroundImage: `url(${JSON.stringify(previewUrl)})`,
          }}
        />
      )}
      {!previewUrl && (
        <p className="mt-4 text-sm text-[#667085]">
          No poster image is attached.
        </p>
      )}
      <input
        type="hidden"
        name="posterAssetId"
        value={currentAssetId ?? ""}
      />
      <input
        type="hidden"
        name="posterUploadPending"
        value={
          selectedFile && uploadedToken !== uploadToken
            ? "true"
            : "false"
        }
      />
      <div className="mt-4 max-w-xl space-y-4">
        <div>
          <label
            htmlFor="event-poster"
            className="mb-2 block text-sm font-semibold text-[#344054]"
          >
            {currentAssetId
              ? "Replace poster image"
              : "Choose poster image"}
          </label>
          <input
            ref={inputRef}
            id="event-poster"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={pending}
            onChange={(event) =>
              updateSelectedFile(
                event.currentTarget.files?.[0] ?? null,
              )
            }
            aria-describedby="event-poster-help"
            className="block min-h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#344054] file:mr-4 file:rounded-full file:border-0 file:bg-[#F4F0E7] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#765A22] disabled:opacity-60"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-[#344054]">
              Selected: <strong>{selectedFile.name}</strong>
            </p>
          )}
          <p
            id="event-poster-help"
            className="mt-2 text-xs leading-5 text-[#667085]"
          >
            The server validates the image contents before storing it.
            A poster is optional.
          </p>
        </div>
        {progress !== null && (
          <div className="space-y-2" aria-live="polite">
            <div className="flex justify-between text-xs text-[#667085]">
              <span>Uploading poster</span>
              <span>{progress}%</span>
            </div>
            <progress
              aria-label="Poster upload progress"
              max={100}
              value={progress}
              className="h-2 w-full accent-[#9A772E]"
            />
          </div>
        )}
        {notice && (
          <AdminNotice
            message={notice.message}
            kind={notice.kind}
            resetKey={notice}
            persistent={notice.kind === "error"}
          />
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={uploadPoster}
            disabled={pending || !selectedFile}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] hover:bg-[#F8F9FB] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
          >
            {pending
              ? "Uploading…"
              : currentAssetId
                ? "Upload replacement"
                : "Upload poster"}
          </button>
          {(currentAssetId || selectedFile) && (
            <button
              type="button"
              onClick={removePoster}
              disabled={pending}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D0D5DD] px-5 text-sm font-semibold text-[#475467] hover:bg-[#F8F9FB] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:w-auto"
            >
              Remove poster
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { normalizeDetectedAudioDuration } from "@/lib/sermon-audio-duration";
import { formatDuration } from "@/lib/sermons";

export const MAX_SERMON_AUDIO_BYTES = 524_288_000;
export const SERMON_AUDIO_ACCEPT = ".mp3,.mp4,.m4a,.aac,.ogg,.wav,.webm,.flac,audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm,audio/flac";

export type SermonAudioUploadResult = {
  ok: boolean;
  message: string;
  cleanupWarning?: boolean;
  durationWarning?: boolean;
};

export type SermonAudioMetadataState = {
  status: "idle" | "loading" | "ready" | "error";
  durationSeconds: number | null;
  preview: string | null;
};

type InternalAudioMetadataState = SermonAudioMetadataState & { source: File | null };

export function useSermonAudioMetadata(file: File | null): SermonAudioMetadataState {
  const [state, setState] = useState<InternalAudioMetadataState>({ source: null, status: "idle", durationSeconds: null, preview: null });

  useEffect(() => {
    if (!file) return;

    let active = true;
    let objectUrl: string | null = null;
    let audio: HTMLAudioElement;
    try {
      objectUrl = URL.createObjectURL(file);
      audio = document.createElement("audio");
    } catch {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      const failureTimer = window.setTimeout(() => {
        if (active) setState({ source: file, status: "error", durationSeconds: null, preview: null });
      }, 0);
      return () => {
        active = false;
        window.clearTimeout(failureTimer);
      };
    }
    if (!objectUrl) return;
    const timeout = window.setTimeout(() => {
      if (active) setState({ source: file, status: "error", durationSeconds: null, preview: null });
    }, 30_000);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      if (!active) return;
      window.clearTimeout(timeout);
      const durationSeconds = normalizeDetectedAudioDuration(audio.duration);
      setState(durationSeconds === null
        ? { source: file, status: "error", durationSeconds: null, preview: null }
        : { source: file, status: "ready", durationSeconds, preview: formatDuration(durationSeconds) });
    };
    audio.onerror = () => {
      if (!active) return;
      window.clearTimeout(timeout);
      setState({ source: file, status: "error", durationSeconds: null, preview: null });
    };
    audio.src = objectUrl;
    audio.load();

    return () => {
      active = false;
      window.clearTimeout(timeout);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!file) return { status: "idle", durationSeconds: null, preview: null };
  if (state.source !== file) return { status: "loading", durationSeconds: null, preview: null };
  return { status: state.status, durationSeconds: state.durationSeconds, preview: state.preview };
}

export function validateSelectedSermonAudio(file: File): string | null {
  if (file.size <= 0 || file.size > MAX_SERMON_AUDIO_BYTES) {
    return "Choose a file larger than 0 bytes and no larger than 500 MiB.";
  }
  if (!/\.(mp3|mp4|m4a|aac|ogg|wav|webm|flac)$/i.test(file.name)) {
    return "Choose an MP3, MP4/M4A, AAC, OGG, WAV, WebM, or FLAC file.";
  }
  return null;
}

export function uploadSermonAudio(
  resourceId: string,
  file: File,
  durationSeconds: number | null,
  onProgress: (percentage: number) => void,
): Promise<SermonAudioUploadResult> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("POST", `/api/admin/sermons/${encodeURIComponent(resourceId)}/audio`);
    request.setRequestHeader("x-audio-file-name", encodeURIComponent(file.name));
    request.setRequestHeader("x-audio-file-size", String(file.size));
    if (durationSeconds !== null) request.setRequestHeader("x-audio-duration-seconds", String(durationSeconds));
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });
    request.addEventListener("load", () => {
      let body: { message?: unknown; ok?: unknown; cleanupWarning?: unknown; durationWarning?: unknown } = {};
      try {
        body = JSON.parse(request.responseText) as typeof body;
      } catch {
        // The generic response below is used if the endpoint did not return JSON.
      }
      const successful = request.status >= 200 && request.status < 300 && body.ok === true;
      resolve({
        ok: successful,
        message: typeof body.message === "string"
          ? body.message
          : successful
            ? "Audio uploaded and attached to this sermon."
            : "The audio upload could not be completed. Please try again.",
        cleanupWarning: body.cleanupWarning === true,
        durationWarning: body.durationWarning === true,
      });
    });
    request.addEventListener("error", () => resolve({
      ok: false,
      message: "The audio upload could not be completed. Check your connection and try again.",
    }));
    request.addEventListener("abort", () => resolve({
      ok: false,
      message: "The audio upload was interrupted. Your draft is saved; select the file and retry.",
    }));
    request.send(file);
  });
}

export function formatSermonAudioSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

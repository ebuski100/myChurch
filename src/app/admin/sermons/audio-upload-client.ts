"use client";

import * as tus from "tus-js-client";
import { useEffect, useState } from "react";
import { normalizeDetectedAudioDuration } from "@/lib/sermon-audio-duration";
import { formatDuration } from "@/lib/sermons";

export const MAX_SERMON_AUDIO_BYTES = 50 * 1024 * 1024;
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
 return `Choose a file larger than 0 bytes and no larger than ${Math.round(MAX_SERMON_AUDIO_BYTES / (1024 * 1024))} MiB.`;
 }
 if (!/\.(mp3|mp4|m4a|aac|ogg|wav|webm|flac)$/i.test(file.name)) {
 return "Choose an MP3, MP4/M4A, AAC, OGG, WAV, WebM, or FLAC file.";
 }
 return null;
}

export async function uploadSermonAudio(
 resourceId: string,
 file: File,
 durationSeconds: number | null,
 onProgress: (percentage: number) => void,
): Promise<SermonAudioUploadResult> {
 // Step A: Request upload authorization
 let authData: { objectPath: string; token: string; mimeType: string };
 try {
 const authRes = await fetch(`/api/admin/sermons/${encodeURIComponent(resourceId)}/audio/authorize`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 filename: file.name,
 size: file.size,
 durationSeconds: durationSeconds !== null ? String(durationSeconds) : null,
 }),
 });
 const authBody = await authRes.json();
 if (!authRes.ok || !authBody.ok) {
 return {
 ok: false,
 message: typeof authBody.message === "string" ? authBody.message : "The audio upload could not be completed. Please try again.",
 };
 }
 authData = {
 objectPath: authBody.objectPath,
 token: authBody.token,
 mimeType: authBody.mimeType || "application/octet-stream",
 };
 } catch {
 return {
 ok: false,
 message: "The audio upload could not be completed. Check your connection and try again.",
 };
 }

 // Get Supabase config
 let supabaseUrl: string;
 let sessionToken: string;
 try {
 const configRes = await fetch("/api/supabase/config", { cache: "no-store" });
 if (!configRes.ok) throw new Error("config");
 const config = await configRes.json();
 supabaseUrl = config.url;

 const { createSupabaseBrowserClient } = await import("@/lib/supabase/browser");
 const supabase = await createSupabaseBrowserClient();
 const { data: sessionData } = await supabase.auth.getSession();
 if (!sessionData.session?.access_token) throw new Error("no session");
 sessionToken = sessionData.session.access_token;
 } catch {
 return {
 ok: false,
 message: "The audio upload could not be completed. Authentication unavailable.",
 };
 }

 const tusEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

 // Step B: Upload directly via TUS
 return new Promise((resolve) => {
 const upload = new tus.Upload(file, {
 endpoint: tusEndpoint,
 retryDelays: [0, 1000, 3000, 5000],
 headers: {
 Authorization: `Bearer ${sessionToken}`,
 "x-upsert": "false",
 },
 metadata: {
 bucketName: "sermon-audio",
 objectName: authData.objectPath,
 contentType: authData.mimeType,
 cacheControl: "0",
 },
 uploadSize: file.size,
 onProgress: (bytesSent, bytesTotal) => {
 if (bytesTotal > 0) {
 onProgress(Math.min(100, Math.round((bytesSent / bytesTotal) * 100)));
 }
 },
 onSuccess: async () => {
 // Step C: Finalize
 try {
 const finalizeRes = await fetch(
 `/api/admin/sermons/${encodeURIComponent(resourceId)}/audio/finalize`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 objectPath: authData.objectPath,
 token: authData.token,
 filename: file.name,
 size: file.size,
 durationSeconds: durationSeconds !== null ? String(durationSeconds) : null,
 }),
 },
 );
 const finalizeBody = await finalizeRes.json();
 const successful = finalizeRes.ok && finalizeBody.ok === true;
 resolve({
 ok: successful,
 message:
 typeof finalizeBody.message === "string"
 ? finalizeBody.message
 : successful
 ? "Audio uploaded and attached to this sermon."
 : "The audio upload could not be completed. Please try again.",
 cleanupWarning: finalizeBody.cleanupWarning === true,
 durationWarning: finalizeBody.durationWarning === true,
 });
 } catch {
 resolve({
 ok: false,
 message: "The audio upload could not be completed. Please try again.",
 });
 }
 },
 onError: (error) => {
 resolve({
 ok: false,
 message: `The audio upload could not be completed. ${error.message || "Please try again."}`,
 });
 },
 });
 upload.start();
 });
}

export function formatSermonAudioSize(bytes: number): string {
 if (bytes < 1024) return `${bytes} bytes`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
 return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

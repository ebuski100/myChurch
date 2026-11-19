"use client";

import { useEffect, useState } from "react";
import {
  downloadSermonAudio,
  getDownloadStatus,
  removeDownload,
  requestPersistentStorage,
  type DownloadStatus,
} from "@/lib/offline-audio-downloads";

export function SermonOfflineDownloadButton({
  sermonId,
  sermonTitle,
}: {
  sermonId: string;
  sermonTitle: string;
}) {
  const [status, setStatus] = useState<DownloadStatus>("not-downloaded");
  const [progress, setProgress] = useState<{ loaded: number; total: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getDownloadStatus(sermonId).then((s) => {
      if (mounted) setStatus(s);
    });
    return () => {
      mounted = false;
    };
  }, [sermonId]);

  const handleDownload = async () => {
    setError(null);
    setStatus("downloading");
    setProgress({ loaded: 0, total: null });
    await requestPersistentStorage();
    try {
      await downloadSermonAudio(sermonId, sermonTitle, (loaded, total) => {
        setProgress({ loaded, total });
      });
      setStatus("complete");
      setProgress(null);
    } catch (e) {
      setStatus("failed");
      setError(e instanceof Error ? e.message : "Download failed");
      setProgress(null);
    }
  };

  const handleRemove = async () => {
    await removeDownload(sermonId);
    setStatus("not-downloaded");
    setProgress(null);
    setError(null);
  };

  if (status === "downloading") {
    const percent =
      progress && progress.total
        ? Math.min(100, Math.round((progress.loaded / progress.total) * 100))
        : null;
    return (
      <div className="flex items-center gap-2" aria-live="polite">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-[#E4E7EC]">
          <div
            className="h-full bg-[#D9B66D] transition-all"
            style={{ width: percent ? `${percent}%` : "40%" }}
          />
        </div>
        <span className="text-xs tabular-nums text-[#667085]">
          {percent !== null
            ? `${percent}%`
            : `${Math.round(progress?.loaded ?? 0 / 1024)} KB`}
        </span>
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[#785B1F]">Available offline</span>
        <button
          type="button"
          onClick={handleRemove}
          className="text-xs text-[#667085] underline hover:text-[#101B33]"
        >
          Remove
        </button>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="text-xs font-semibold text-[#9A772E] hover:underline"
        >
          Retry download
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="grid size-11 shrink-0 place-items-center rounded-full text-[#667085] transition hover:bg-[#F8F4E9] hover:text-[#785B1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E]"
      aria-label={`Download ${sermonTitle} for offline`}
      title="Download for offline"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="size-5"
      >
        <path
          d="M10 2.75v9.5m0 0 3.5-3.5M10 12.25l-3.5-3.5M3.5 13.5v2A1.75 1.75 0 0 0 5.25 17.25h9.5A1.75 1.75 0 0 0 16.5 15.5v-2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

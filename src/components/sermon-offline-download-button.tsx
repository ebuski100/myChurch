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
  const [status, setStatus] =
    useState<DownloadStatus>("not-downloaded");
  const [progress, setProgress] = useState<{
    loaded: number;
    total: number | null;
  } | null>(null);
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

    try {
      await requestPersistentStorage();

      await downloadSermonAudio(
        sermonId,
        sermonTitle,
        (loaded, total) => {
          setProgress({ loaded, total });
        },
      );

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

  const buttonClass =
    "flex min-w-0 items-center justify-center gap-2 rounded-xl border border-[#E4E7EC] px-2 py-3 text-[#344054] transition hover:border-[#D9B66D] hover:bg-[#F8F4E9] hover:text-[#785B1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A772E] sm:px-3";

  if (status === "downloading") {
    const percent =
      progress?.total && progress.total > 0
        ? Math.min(
            100,
            Math.round((progress.loaded / progress.total) * 100),
          )
        : null;

    return (
      <div
        className="flex min-w-0 flex-col justify-center gap-1.5 rounded-xl border border-[#E4E7EC] px-3 py-2.5"
        aria-live="polite"
        aria-label={`Saving ${sermonTitle} for offline playback`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#785B1F]">
            Saving offline...
          </span>

          <span className="shrink-0 text-xs tabular-nums text-[#667085]">
            {percent !== null
              ? `${percent}%`
              : `${Math.round((progress?.loaded ?? 0) / 1024)} KB`}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E4E7EC]">
          <div
            className="h-full rounded-full bg-[#D9B66D] transition-all"
            style={{
              width: percent !== null ? `${percent}%` : "40%",
            }}
          />
        </div>
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[#D9E8D8] bg-[#F5FAF4] px-1 md:px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2 ">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="size-5 shrink-0 text-[#397447]"
          >
            <path
              d="m5 10 3.2 3.2L15 6.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span className="text-xs font-semibold text-[#397447]">
            Available offline
          </span>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          className="shrink-0 text-xs text-[#667085] underline underline-offset-2 hover:text-[#101B33]"
        >
          Remove
        </button>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex min-w-0 flex-col justify-center gap-1 rounded-xl border border-red-200 px-3 py-2">
        <button
          type="button"
          onClick={handleDownload}
          className="text-left text-xs font-semibold text-[#9A772E] hover:underline"
        >
          Retry offline download
        </button>

        {error && (
          <span className="line-clamp-2 text-[11px] text-red-600">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={buttonClass}
      aria-label={`Save ${sermonTitle} for offline playback`}
      title="Save for offline playback"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="size-5 shrink-0"
      >
        <path
          d="M2 8.82A15.9 15.9 0 0 1 12 5.3a15.9 15.9 0 0 1 10 3.52M5 12.5a10.9 10.9 0 0 1 14 0M8.5 16a5.7 5.7 0 0 1 7 0M12 20h.01"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m3 3 18 18"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>

      <span className="min-w-0 text-left">
        <span className="block text-xs font-semibold sm:text-sm">
          Save for offline
        </span>
        <span className="hidden text-[11px] text-[#667085] sm:block">
          Play without internet
        </span>
      </span>
    </button>
  );
}

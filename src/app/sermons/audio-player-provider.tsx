"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Sermon } from "@/lib/sermons";

type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "error";

type AudioPlayerContextValue = {
  currentSermon: Sermon | null;
  status: PlayerStatus;
  errorMessage: string | null;
  playSermon: (sermon: Sermon) => Promise<void>;
  togglePlayback: () => Promise<void>;
};

const AudioPlayerContext =
  createContext<AudioPlayerContextValue | null>(null);

const waveformBars = [
  12, 22, 15, 29, 19, 34, 13, 25, 37, 18, 28, 14, 33, 21, 39, 17, 27,
  12, 31, 20, 36, 15, 25, 33, 18, 29, 13, 22, 35, 16, 27, 11, 31, 19,
  37, 23, 14, 29, 18, 34, 12, 25, 32, 17, 28, 14, 36, 20, 30, 16,
];

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function SermonArtwork() {
  return (
    <div
      className="relative grid size-[58px] shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#E6C77D]/20 bg-gradient-to-br from-[#263958] via-[#172641] to-[#101827] shadow-inner sm:size-[68px]"
      aria-hidden="true"
    >
      <div className="absolute -right-5 -top-5 size-16 rounded-full bg-[#D7B66D]/15 blur-xl" />
      <div className="absolute -bottom-5 -left-3 size-12 rounded-full bg-[#D7B66D]/10 blur-lg" />

      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="relative size-9 text-[#E6C77D] sm:size-10"
      >
        <path
          d="M32 8v14M25 15h14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M13 31 32 20l19 11v22H13V31Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M23 53V37h18v16M28 37v16M36 37v16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 31 32 17l24 14"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function LiveWaveform({ active }: { active: boolean }) {
  return (
    <div
      className="flex h-8 min-w-0 flex-1 items-center justify-center gap-[2px] overflow-hidden"
      aria-hidden="true"
    >
      {waveformBars.map((height, index) => (
        <span
          key={index}
          className={`waveform-bar w-[2px] shrink-0 rounded-full bg-gradient-to-t from-[#C49A43] to-[#F1D99A] sm:w-[3px] ${
            active ? "is-playing" : ""
          }`}
          style={{
            height: `${height}px`,
            animationDelay: `${(index % 12) * -0.11}s`,
          }}
        />
      ))}
    </div>
  );
}

export function AudioPlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeResourceIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(
    null,
  );
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playSermon = useCallback(async (sermon: Sermon) => {
    const audio = audioRef.current;

    if (!audio) {
      setErrorMessage(
        "The audio player is not ready. Please try again.",
      );
      setStatus("error");
      return;
    }

    const requestId = ++requestIdRef.current;
    const isNewSermon = activeResourceIdRef.current !== sermon.id;

    setCurrentSermon(sermon);
    setErrorMessage(null);

    if (isNewSermon) {
      activeResourceIdRef.current = sermon.id;
      setCurrentTime(0);
      setDuration(0);
      setStatus("loading");

      audio.pause();
      audio.src = `/api/sermons/${encodeURIComponent(sermon.id)}/audio`;
      audio.load();
    } else if (audio.error) {
      setStatus("loading");
      audio.load();
    } else if (!audio.paused && !audio.ended) {
      setStatus("playing");
      return;
    }

    setStatus("loading");

    try {
      await audio.play();

      if (requestId !== requestIdRef.current) return;

      setErrorMessage(null);
      setStatus(audio.paused ? "paused" : "playing");
    } catch {
      if (requestId !== requestIdRef.current) return;

      setStatus("error");
      setErrorMessage(
        "This recording could not start. Check your connection and try again.",
      );
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio || !currentSermon) return;

    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }

    const requestId = ++requestIdRef.current;

    setErrorMessage(null);
    setStatus("loading");

    if (audio.error) {
      audio.load();
    }

    try {
      await audio.play();

      if (requestId !== requestIdRef.current) return;

      setErrorMessage(null);
      setStatus(audio.paused ? "paused" : "playing");
    } catch {
      if (requestId !== requestIdRef.current) return;

      setStatus("error");
      setErrorMessage(
        "This recording could not start. Check your connection and try again.",
      );
    }
  }, [currentSermon]);

  const seekTo = useCallback((value: string) => {
    const audio = audioRef.current;
    const nextTime = Number(value);

    if (
      !audio ||
      !Number.isFinite(nextTime) ||
      !Number.isFinite(audio.duration)
    ) {
      return;
    }

    audio.currentTime = Math.max(
      0,
      Math.min(nextTime, audio.duration),
    );
    setCurrentTime(audio.currentTime);
  }, []);

  const closePlayer = useCallback(() => {
    ++requestIdRef.current;

    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    activeResourceIdRef.current = null;
    setCurrentSermon(null);
    setStatus("idle");
    setErrorMessage(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSermon,
        status,
        errorMessage,
        playSermon,
        togglePlayback,
      }}
    >
      <div
        className={
          currentSermon
            ? "flex min-h-full flex-col pb-44 sm:pb-36"
            : "flex min-h-full flex-col"
        }
      >
        {children}
      </div>

      <aside
        aria-label="Audio sermon player"
        aria-hidden={!currentSermon}
        className={
          currentSermon
            ? "fixed inset-x-0 bottom-0 z-50 text-white"
            : "hidden"
        }
      >
        <div className="pointer-events-none absolute inset-0 bg-[#0C162B]/95 shadow-[0_-14px_50px_rgba(4,10,24,0.35)] backdrop-blur-2xl" />

        <div className="relative border-t border-white/[0.09]">
          <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-10">
            <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)_auto] sm:items-center sm:gap-5 lg:gap-8">
              <div className="flex min-w-0 items-center gap-3 pr-8 sm:pr-0">
                <SermonArtwork />

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`size-1.5 rounded-full ${
                        isPlaying
                          ? "bg-[#E6C77D]"
                          : status === "error"
                            ? "bg-red-400"
                            : "bg-white/35"
                      }`}
                    />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#E6C77D] sm:text-[10px]">
                      {isPlaying
                        ? "Now listening"
                        : isLoading
                          ? "Preparing sermon"
                          : status === "error"
                            ? "Playback issue"
                            : "Sermon player"}
                    </p>
                  </div>

                  <p className="truncate text-sm font-semibold tracking-[-0.02em] sm:text-[15px]">
                    {currentSermon?.title ??
                      "Select a sermon to begin"}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-white/55 sm:text-xs">
                    {currentSermon?.preacher ||
                      "VictoryCity Revival Ministry"}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => void togglePlayback()}
                  disabled={!currentSermon}
                  aria-label={
                    isPlaying ? "Pause sermon" : "Play sermon"
                  }
                  title={isPlaying ? "Pause sermon" : "Play sermon"}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E6C77D] text-[#101B33] transition hover:bg-[#F1DCA4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C77D] disabled:opacity-50"
                >
                  {isPlaying ? (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-4"
                      aria-hidden="true"
                    >
                      <rect
                        x="5"
                        y="4"
                        width="3.5"
                        height="12"
                        rx="1"
                      />
                      <rect
                        x="11.5"
                        y="4"
                        width="3.5"
                        height="12"
                        rx="1"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="ml-0.5 size-4"
                      aria-hidden="true"
                    >
                      <path d="M6.2 3.9a1 1 0 0 0-1.5.87v10.46a1 1 0 0 0 1.5.87l8.45-5.23a1 1 0 0 0 0-1.7L6.2 3.9Z" />
                    </svg>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <LiveWaveform active={isPlaying} />

                  <div className="mt-1 flex items-center gap-2">
                    <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-white/65">
                      {formatAudioTime(currentTime)}
                    </span>

                    <input
                      type="range"
                      min={0}
                      max={Math.max(duration, 1)}
                      step={1}
                      value={Math.min(
                        currentTime,
                        Math.max(duration, 1),
                      )}
                      onChange={(event) =>
                        seekTo(event.currentTarget.value)
                      }
                      disabled={!currentSermon || duration <= 0}
                      aria-label="Seek in sermon"
                      aria-valuetext={`${formatAudioTime(currentTime)} of ${formatAudioTime(duration)}`}
                      className="sermon-progress min-w-0 flex-1"
                      style={{
                        background: `linear-gradient(to right, #E6C77D 0%, #E6C77D ${progressPercent}%, rgba(255,255,255,0.24) ${progressPercent}%, rgba(255,255,255,0.24) 100%)`,
                      }}
                    />

                    <span className="w-8 shrink-0 text-[10px] tabular-nums text-white/65">
                      {formatAudioTime(duration)}
                    </span>
                  </div>

                  <p
                    aria-live="polite"
                    className="mt-1 min-h-4 truncate text-[10px] text-white/50"
                  >
                    {errorMessage ??
                      (isLoading
                        ? "Getting the message ready…"
                        : isPlaying
                          ? "Take a moment and listen."
                          : status === "paused"
                            ? "Paused · Resume whenever you're ready."
                            : status === "error"
                              ? "Playback could not start."
                              : "Choose a message and listen anywhere.")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePlayer}
                className="absolute right-0 top-0 grid size-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C77D] sm:static sm:size-9 sm:shrink-0"
                aria-label="Close audio player"
                title="Close player"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path
                    d="m5 5 10 10M15 5 5 15"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          preload="none"
          className="sr-only"
          aria-label={`Audio recording: ${currentSermon?.title ?? "selected sermon"}`}
          onLoadStart={() => setStatus("loading")}
          onWaiting={() => {
            if (audioRef.current && !audioRef.current.paused) {
              setStatus("loading");
            }
          }}
          onLoadedMetadata={(event) => {
            const nextDuration = event.currentTarget.duration;
            setDuration(
              Number.isFinite(nextDuration) ? nextDuration : 0,
            );
          }}
          onDurationChange={(event) => {
            const nextDuration = event.currentTarget.duration;
            setDuration(
              Number.isFinite(nextDuration) ? nextDuration : 0,
            );
          }}
          onTimeUpdate={(event) => {
            setCurrentTime(event.currentTarget.currentTime);
          }}
          onCanPlay={() => {
            // canplay means the audio is ready, not that it is paused.
          }}
          onPlay={() => {
            setErrorMessage(null);
          }}
          onPlaying={() => {
            setStatus("playing");
            setErrorMessage(null);
          }}
          onPause={() => {
            if (audioRef.current?.ended) return;

            setStatus((current) =>
              current === "error" ? "error" : "paused",
            );
          }}
          onEnded={(event) => {
            setCurrentTime(event.currentTarget.currentTime);
            setStatus("paused");
          }}
          onError={() => {
            if (!currentSermon) return;

            setStatus("error");
            setErrorMessage(
              "This recording is unavailable right now. Please try again later.",
            );
          }}
        >
          Your browser does not support audio playback.
        </audio>
      </aside>

      <style jsx>{`
        .sermon-progress {
          display: block;
          width: 100%;
          height: 6px;
          appearance: none;
          -webkit-appearance: none;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }

        .sermon-progress:hover {
          height: 8px;
        }

        .sermon-progress:focus-visible {
          outline: 2px solid #e6c77d;
          outline-offset: 4px;
        }

        .sermon-progress:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .sermon-progress::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 15px;
          height: 15px;
          border: 2px solid #fff;
          border-radius: 50%;
          background: #e6c77d;
          box-shadow:
            0 0 0 2px rgba(230, 199, 125, 0.22),
            0 1px 5px rgba(0, 0, 0, 0.4);
          cursor: grab;
        }

        .sermon-progress:active::-webkit-slider-thumb {
          cursor: grabbing;
        }

        .sermon-progress::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border: 2px solid #fff;
          border-radius: 50%;
          background: #e6c77d;
          box-shadow:
            0 0 0 2px rgba(230, 199, 125, 0.22),
            0 1px 5px rgba(0, 0, 0, 0.4);
          cursor: grab;
        }

        .waveform-bar {
          transform-origin: center;
          opacity: 0.55;
        }

        .waveform-bar.is-playing {
          animation: waveform 0.85s ease-in-out infinite alternate;
          will-change: transform, opacity;
        }

        @keyframes waveform {
          0% {
            transform: scaleY(0.24);
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scaleY(1);
            opacity: 0.85;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .waveform-bar.is-playing {
            animation: none;
            transform: scaleY(0.65);
          }
        }
      `}</style>
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error(
      "useAudioPlayer must be used inside AudioPlayerProvider.",
    );
  }

  return context;
}

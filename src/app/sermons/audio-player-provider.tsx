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

export function AudioPlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeResourceIdRef = useRef<string | null>(null);
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(
    null,
  );
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null,
  );

  const playSermon = useCallback(async (sermon: Sermon) => {
    const audio = audioRef.current;
    if (!audio) {
      setErrorMessage(
        "The audio player is not ready. Please try again.",
      );
      setStatus("error");
      return;
    }

    setCurrentSermon(sermon);
    setErrorMessage(null);

    if (activeResourceIdRef.current !== sermon.id) {
      activeResourceIdRef.current = sermon.id;
      setStatus("loading");
      audio.src = `/api/sermons/${encodeURIComponent(sermon.id)}/audio`;
      audio.load();
    } else if (audio.error) {
      setStatus("loading");
      audio.load();
    }

    try {
      await audio.play();
    } catch {
      setStatus("error");
      setErrorMessage(
        "This recording could not start. Check your connection and try again.",
      );
    }
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentSermon) return;

    if (audio.paused) {
      setErrorMessage(null);
      if (audio.error) {
        audio.load();
      }
      setStatus("loading");
      try {
        await audio.play();
      } catch {
        setStatus("error");
        setErrorMessage(
          "This recording could not start. Check your connection and try again.",
        );
      }
    } else {
      audio.pause();
    }
  }, [currentSermon]);

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
            ? "flex min-h-full flex-col pb-37"
            : "flex min-h-full flex-col"
        }
      >
        {children}
      </div>
      <aside
        aria-label="Audio sermon player"
        className={
          currentSermon
            ? "fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#101B33] text-white shadow-[0_-8px_30px_rgba(16,27,51,0.18)]"
            : "hidden"
        }
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-8 md:flex-row md:items-center md:gap-6 lg:px-10">
          <div className="min-w-0 md:w-64 md:shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E6C77D]">
              Now listening
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {currentSermon?.title ?? "Select a sermon to begin"}
            </p>
            <p className="truncate text-xs text-white/60">
              {currentSermon?.preacher ||
                "VictoryCity Revival Ministry"}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <audio
              ref={audioRef}
              controls
              controlsList="nodownload"
              preload="none"
              className="h-10 w-full"
              aria-label={`Audio player for ${currentSermon?.title ?? "selected sermon"}`}
              onLoadStart={() => setStatus("loading")}
              onWaiting={() => setStatus("loading")}
              onCanPlay={() =>
                setStatus((current) =>
                  current === "playing" ? "playing" : "paused",
                )
              }
              onPlay={() => {
                setStatus("playing");
                setErrorMessage(null);
              }}
              onPause={() =>
                setStatus((current) =>
                  current === "error" ? "error" : "paused",
                )
              }
              onEnded={() => setStatus("paused")}
              onError={() => {
                setStatus("error");
                setErrorMessage(
                  "This recording is unavailable right now. Please try again later.",
                );
              }}
            >
              Your browser does not support audio playback.
            </audio>
            <p
              aria-live="polite"
              className="mt-1 min-h-4 text-[11px] text-white/65"
            >
              {errorMessage ??
                (status === "loading"
                  ? "Loading recording…"
                  : status === "playing"
                    ? "Playing"
                    : status === "paused"
                      ? "Paused"
                      : "Ready to play")}
            </p>
          </div>

          <button
            type="button"
            disabled={!currentSermon}
            onClick={() => {
              audioRef.current?.pause();
              audioRef.current?.removeAttribute("src");
              audioRef.current?.load();
              activeResourceIdRef.current = null;
              setCurrentSermon(null);
              setStatus("idle");
              setErrorMessage(null);
            }}
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C77D] md:static md:shrink-0"
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
      </aside>
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

// "use client";

// import {
//   createContext,
//   useCallback,
//   useContext,
//   useRef,
//   useState,
//   type ReactNode,
// } from "react";
// import type { Sermon } from "@/lib/sermons";

// type PlayerStatus =
//   | "idle"
//   | "loading"
//   | "playing"
//   | "paused"
//   | "error";

// type AudioPlayerContextValue = {
//   currentSermon: Sermon | null;
//   status: PlayerStatus;
//   errorMessage: string | null;
//   playSermon: (sermon: Sermon) => Promise<void>;
//   togglePlayback: () => Promise<void>;
// };

// const AudioPlayerContext =
//   createContext<AudioPlayerContextValue | null>(null);

// export function AudioPlayerProvider({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const activeResourceIdRef = useRef<string | null>(null);

//   const [currentSermon, setCurrentSermon] = useState<Sermon | null>(
//     null,
//   );
//   const [status, setStatus] = useState<PlayerStatus>("idle");
//   const [errorMessage, setErrorMessage] = useState<string | null>(
//     null,
//   );

//   const playSermon = useCallback(async (sermon: Sermon) => {
//     const audio = audioRef.current;

//     if (!audio) {
//       setErrorMessage(
//         "The audio player is not ready. Please try again.",
//       );
//       setStatus("error");
//       return;
//     }

//     setCurrentSermon(sermon);
//     setErrorMessage(null);

//     if (activeResourceIdRef.current !== sermon.id) {
//       activeResourceIdRef.current = sermon.id;
//       setStatus("loading");
//       audio.src = `/api/sermons/${encodeURIComponent(sermon.id)}/audio`;
//       audio.load();
//     } else if (audio.error) {
//       setStatus("loading");
//       audio.load();
//     }

//     try {
//       await audio.play();
//     } catch {
//       setStatus("error");
//       setErrorMessage(
//         "This recording could not start. Check your connection and try again.",
//       );
//     }
//   }, []);

//   const togglePlayback = useCallback(async () => {
//     const audio = audioRef.current;

//     if (!audio || !currentSermon) return;

//     if (audio.paused) {
//       setErrorMessage(null);

//       if (audio.error) {
//         audio.load();
//       }

//       setStatus("loading");

//       try {
//         await audio.play();
//       } catch {
//         setStatus("error");
//         setErrorMessage(
//           "This recording could not start. Check your connection and try again.",
//         );
//       }
//     } else {
//       audio.pause();
//     }
//   }, [currentSermon]);

//   return (
//     <AudioPlayerContext.Provider
//       value={{
//         currentSermon,
//         status,
//         errorMessage,
//         playSermon,
//         togglePlayback,
//       }}
//     >
//       <div
//         className={
//           currentSermon
//             ? "flex min-h-full flex-col pb-28"
//             : "flex min-h-full flex-col"
//         }
//       >
//         {children}
//       </div>

//       <aside
//         aria-label="Audio sermon player"
//         className={
//           currentSermon
//             ? "fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#101B33] text-white shadow-[0_-8px_30px_rgba(16,27,51,0.18)]"
//             : "hidden"
//         }
//       >
//         <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-8 md:flex-row md:items-center md:gap-6 lg:px-10">
//           <div className="min-w-0 md:w-64 md:shrink-0">
//             <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E6C77D]">
//               Now listening
//             </p>

//             <p className="mt-1 truncate text-sm font-semibold">
//               {currentSermon?.title ?? "Select a sermon to begin"}
//             </p>

//             <p className="truncate text-xs text-white/60">
//               {currentSermon?.preacher ||
//                 "VictoryCity Revival Ministry"}
//             </p>
//           </div>

//           <div className="min-w-0 flex-1">
//             <audio
//               ref={audioRef}
//               controls
//               controlsList="nodownload"
//               preload="none"
//               className="h-10 w-full"
//               aria-label={`Audio player for ${
//                 currentSermon?.title ?? "selected sermon"
//               }`}
//               onLoadStart={() => setStatus("loading")}
//               onWaiting={() => setStatus("loading")}
//               onCanPlay={() =>
//                 setStatus((current) =>
//                   current === "playing" ? "playing" : "paused",
//                 )
//               }
//               onPlay={() => {
//                 setStatus("playing");
//                 setErrorMessage(null);
//               }}
//               onPause={() =>
//                 setStatus((current) =>
//                   current === "error" ? "error" : "paused",
//                 )
//               }
//               onEnded={() => setStatus("paused")}
//               onError={() => {
//                 setStatus("error");
//                 setErrorMessage(
//                   "This recording is unavailable right now. Please try again later.",
//                 );
//               }}
//             >
//               Your browser does not support audio playback.
//             </audio>

//             <p
//               aria-live="polite"
//               className="mt-1 min-h-4 text-[11px] text-white/65"
//             >
//               {errorMessage ??
//                 (status === "loading"
//                   ? "Loading recording…"
//                   : status === "playing"
//                     ? "Playing"
//                     : status === "paused"
//                       ? "Paused"
//                       : "Ready to play")}
//             </p>
//           </div>

//           <button
//             type="button"
//             disabled={!currentSermon}
//             onClick={() => {
//               audioRef.current?.pause();
//               audioRef.current?.removeAttribute("src");
//               audioRef.current?.load();

//               activeResourceIdRef.current = null;
//               setCurrentSermon(null);
//               setStatus("idle");
//               setErrorMessage(null);
//             }}
//             className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6C77D] md:static md:shrink-0"
//             aria-label="Close audio player"
//             title="Close player"
//           >
//             <svg
//               viewBox="0 0 20 20"
//               fill="none"
//               className="size-4"
//               aria-hidden="true"
//             >
//               <path
//                 d="m5 5 10 10M15 5 5 15"
//                 stroke="currentColor"
//                 strokeWidth="1.7"
//                 strokeLinecap="round"
//               />
//             </svg>
//           </button>
//         </div>
//       </aside>
//     </AudioPlayerContext.Provider>
//   );
// }

// export function useAudioPlayer() {
//   const context = useContext(AudioPlayerContext);

//   if (!context) {
//     throw new Error(
//       "useAudioPlayer must be used inside AudioPlayerProvider.",
//     );
//   }

//   return context;
// }

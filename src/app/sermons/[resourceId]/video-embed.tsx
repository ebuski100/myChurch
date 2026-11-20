// "use client";

// import { useEffect, useRef } from "react";
// import { usePathname } from "next/navigation";

// type VideoEmbedProps = {
//  src: string;
//  title: string;
// };

// export default function VideoEmbed({ src, title }: VideoEmbedProps) {
//  const iframeRef = useRef<HTMLIFrameElement>(null);
//  const pathname = usePathname();

//  useEffect(() => {
//  const iframe = iframeRef.current;
//  return () => {
//  if (iframe) iframe.src = "about:blank";
//  };
//  }, []);

//  useEffect(() => {
//  const iframe = iframeRef.current;
//  if (iframe && iframe.src !== src) {
//  iframe.src = src;
//  }
//  }, [pathname, src]);

//  return (
//  <iframe
//  ref={iframeRef}
//  src={src}
//  title={title}
//  className="h-full w-full"
//  loading="eager"
//  referrerPolicy="strict-origin-when-cross-origin"
//  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//  allowFullScreen
//  />
//  );
// }

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type VideoEmbedProps = {
  src: string;
  title: string;
};

const AUDIO_PLAYING_EVENT = "vc:audio-playing";
const VIDEO_PLAYING_EVENT = "vc:video-playing";

function getYouTubePlayerSrc(src: string) {
  try {
    const url = new URL(src);
    const host = url.hostname.toLowerCase();
    const isYouTube =
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com");

    if (!isYouTube) return src;

    url.searchParams.set("enablejsapi", "1");
    if (typeof window !== "undefined") {
      url.searchParams.set("origin", window.location.origin);
    }
    return url.toString();
  } catch {
    return src;
  }
}

export default function VideoEmbed({ src, title }: VideoEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pathname = usePathname();
  const playerSrc = getYouTubePlayerSrc(src);

  useEffect(() => {
    const iframe = iframeRef.current;

    const handleAudioPlaying = () => {
      iframe?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "pauseVideo",
          args: [],
        }),
        "*",
      );
    };

    const handleVideoMessage = (event: MessageEvent) => {
      if (
        !iframe?.contentWindow ||
        event.source !== iframe.contentWindow
      ) {
        return;
      }

      // YouTube sends player events as JSON messages from its iframe.
      let message: { event?: string; info?: unknown };
      try {
        message =
          typeof event.data === "string"
            ? JSON.parse(event.data)
            : event.data;
      } catch {
        return;
      }

      // YouTube player state 1 means the video is playing.
      if (
        message?.event === "onStateChange" &&
        Number(message.info) === 1
      ) {
        window.dispatchEvent(new Event(VIDEO_PLAYING_EVENT));
      }
    };

    const subscribeToPlayerEvents = () => {
      iframe?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "addEventListener",
          args: ["onStateChange"],
        }),
        "*",
      );
    };

    window.addEventListener(AUDIO_PLAYING_EVENT, handleAudioPlaying);
    window.addEventListener("message", handleVideoMessage);
    iframe?.addEventListener("load", subscribeToPlayerEvents);

    // Subscribe immediately as well in case the iframe has already loaded.
    subscribeToPlayerEvents();

    return () => {
      window.removeEventListener(
        AUDIO_PLAYING_EVENT,
        handleAudioPlaying,
      );
      window.removeEventListener("message", handleVideoMessage);
      iframe?.removeEventListener("load", subscribeToPlayerEvents);
      if (iframe) iframe.src = "about:blank";
    };
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.src !== playerSrc) {
      iframe.src = playerSrc;
    }
  }, [pathname, playerSrc]);

  return (
    <iframe
      ref={iframeRef}
      src={playerSrc}
      title={title}
      className="h-full w-full"
      loading="eager"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

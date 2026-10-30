"use client";

import { useEffect, useRef, type ReactNode } from "react";

type VideoPlayerFocusProps = {
  children: ReactNode;
};

export default function VideoPlayerFocus({
  children,
}: VideoPlayerFocusProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={containerRef}
      className="scroll-mt-28"
      tabIndex={-1}
      aria-label="Sermon video player"
    >
      {children}
    </div>
  );
}

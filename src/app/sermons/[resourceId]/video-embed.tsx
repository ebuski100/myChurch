"use client";

type VideoEmbedProps = {
  src: string;
  title: string;
};

export default function VideoEmbed({ src, title }: VideoEmbedProps) {
  return (
    <iframe
      src={src}
      title={title}
      className="h-full w-full"
      loading="eager"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}

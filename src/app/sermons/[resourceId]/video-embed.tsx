"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type VideoEmbedProps = {
 src: string;
 title: string;
};

export default function VideoEmbed({ src, title }: VideoEmbedProps) {
 const iframeRef = useRef<HTMLIFrameElement>(null);
 const pathname = usePathname();

 useEffect(() => {
 const iframe = iframeRef.current;
 return () => {
 if (iframe) iframe.src = "about:blank";
 };
 }, []);

 useEffect(() => {
 const iframe = iframeRef.current;
 if (iframe && iframe.src !== src) {
 iframe.src = src;
 }
 }, [pathname, src]);

 return (
 <iframe
 ref={iframeRef}
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
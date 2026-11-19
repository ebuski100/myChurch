import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VictoryCity Revival Ministry",
    short_name: "VictoryCity",
    description: "VictoryCity Revival Ministry — Massive Grace Explosion.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: "#D9B66D",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

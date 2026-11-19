import type { Metadata } from "next";
import "./globals.css";
import { AudioPlayerProvider } from "@/app/sermons/audio-player-provider";

import { ListenLaterProvider } from "@/app/sermons/listen-later-provider";

import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "VictoryCity Revival Ministry | Massive Grace Explosion",
  description:
    "Join VictoryCity Revival Ministry in Coal Camp, Zone 6, Agric Quarters. Sunday service 8:00 AMâ€“11:00 AM and Wednesday service 4:00 PMâ€“6:00 PM.",
  metadataBase: new URL("https://victorycityrevival.org"),
  openGraph: {
    title: "VictoryCity Revival Ministry | Massive Grace Explosion",
    description: "Join VictoryCity Revival Ministry in Coal Camp, Zone 6, Agric Quarters.",
    images: [{ url: "/images/victory-city-logo.png" }],
  },
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <ListenLaterProvider>
          <AudioPlayerProvider>{children}</AudioPlayerProvider>
        </ListenLaterProvider>
      </body>
    </html>
  );
}

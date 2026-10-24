import type { Metadata } from "next";
import "./globals.css";
import { AudioPlayerProvider } from "@/app/sermons/audio-player-provider";

import { ListenLaterProvider } from "@/app/sermons/listen-later-provider";

export const metadata: Metadata = {
  title: "VictoryCity Revival Ministry | Massive Grace Explosion",
  description:
    "Join VictoryCity Revival Ministry in Coal Camp, Zone 6, Agric Quarters. Sunday service 8:00 AM–11:00 AM and Wednesday service 4:00 PM–6:00 PM.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ListenLaterProvider>
          <AudioPlayerProvider>{children}</AudioPlayerProvider>
        </ListenLaterProvider>
      </body>
    </html>
  );
}

import "server-only";

const YOUTUBE_API_URL =
  "https://www.googleapis.com/youtube/v3/videos";

function parseIsoDuration(value: string): number | null {
  const match =
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
      value,
    );

  if (!match) return null;

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);

  const totalSeconds =
    days * 86400 + hours * 3600 + minutes * 60 + seconds;

  return Number.isSafeInteger(totalSeconds) && totalSeconds > 0
    ? totalSeconds
    : null;
}

type YouTubeVideosResponse = {
  items?: Array<{
    contentDetails?: {
      duration?: string;
    };
  }>;
};

export async function getYouTubeDurationSeconds(
  videoId: string,
): Promise<number> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_DATA_API_KEY is not configured.");
  }

  const url = new URL(YOUTUBE_API_URL);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error("YouTube duration lookup failed.");
  }

  const data = (await response.json()) as YouTubeVideosResponse;
  const isoDuration = data.items?.[0]?.contentDetails?.duration;

  if (!isoDuration) {
    throw new Error(
      "YouTube did not return a duration for this video.",
    );
  }

  const durationSeconds = parseIsoDuration(isoDuration);

  if (durationSeconds === null) {
    throw new Error("YouTube returned an invalid video duration.");
  }

  return durationSeconds;
}

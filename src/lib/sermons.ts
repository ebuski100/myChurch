export type Sermon = {
  id: string;
  title: string;
  preacher: string | null;
  date: string | null;
  durationSeconds: number | null;
  category: string | null;
  audioUrl: string | null;
  downloadFilename: string | null;
  isSample: boolean;
};

/**
 * Sample content keeps the library layout reviewable until real recordings
 * and verified sermon details are supplied by the ministry.
 */
export const sermons: Sermon[] = [
  {
    id: "sample-sermon",
    title: "Sermon title to be provided",
    preacher: null,
    date: null,
    durationSeconds: null,
    category: null,
    audioUrl: null,
    downloadFilename: null,
    isSample: true,
  },
];

export function formatDuration(durationSeconds: number | null) {
  if (durationSeconds === null) return null;

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

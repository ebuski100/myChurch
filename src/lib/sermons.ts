export type Sermon = {
  id: string;
  title: string;
  preacher: string | null;
  date: string | null;
  durationSeconds: number | null;
  category: string | null;
  downloadAllowed: boolean;
};

export function formatDuration(durationSeconds: number | null) {
  if (durationSeconds === null) return null;

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

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
  if (durationSeconds === null || !Number.isSafeInteger(durationSeconds) || durationSeconds <= 0) return null;

  const totalMinutes = Math.floor(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} hr${minutes > 0 ? ` ${minutes} min` : ""}`;
  if (totalMinutes > 0) return `${totalMinutes} min`;
  return `${durationSeconds} sec`;
}

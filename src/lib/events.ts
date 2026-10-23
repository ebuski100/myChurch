export type ChurchEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
  description: string | null;
  imageUrl?: string | null;
  status: "upcoming" | "ongoing" | "past";
};

export function getEventTimingStatus(
  startsAt: string,
  endsAt: string | null,
  now = new Date(),
): ChurchEvent["status"] {
  const startTime = Date.parse(startsAt);
  if (!Number.isFinite(startTime)) return "past";
  if (startTime > now.getTime()) return "upcoming";

  const endTime = endsAt ? Date.parse(endsAt) : Number.NaN;
  return Number.isFinite(endTime) && endTime > now.getTime()
    ? "ongoing"
    : "past";
}

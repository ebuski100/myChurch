export type ChurchEvent = {
  id: string;
  title: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  description: string;
  imageUrl?: string | null;
  status: "upcoming" | "past" | "draft";
};

/** Confirmed public events only; add a record after the ministry confirms it. */
export const events: ChurchEvent[] = [];

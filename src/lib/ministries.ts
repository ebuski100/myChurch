export type Ministry = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  involvementLabel?: string | null;
  involvementUrl?: string | null;
};

/** Confirmed ministry listings only; add records after the church approves them. */
export const ministries: Ministry[] = [];

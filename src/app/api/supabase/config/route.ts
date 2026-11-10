import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase Auth server configuration is missing.");
  }

  return NextResponse.json(
    { url, publishableKey },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}

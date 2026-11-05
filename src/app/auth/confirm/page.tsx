import type { Metadata } from "next";
import { SessionConfirmClient } from "./session-confirm-client";
import { validateInvitationToken } from "@/lib/admin-invitations";
import { DEFAULT_CONFIRM_NEXT } from "@/lib/admin-invite-setup";

export const metadata: Metadata = {
  title: "Verify invitation | Admin | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

/**
 * Fragment-delivery landing page. When Supabase Auth appends
 * `#access_token=…&refresh_token=…` instead of `?code=`, the callback route
 * never sees it — this page finishes the handshake in the browser and then
 * sends the invitee to password setup with their M12 token intact.
 */
export default async function AuthConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    error?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const token = validateInvitationToken(params.token);

  return (
    <SessionConfirmClient
      token={token.ok ? token.token : null}
      error={params.error ?? null}
      next={params.next ?? DEFAULT_CONFIRM_NEXT}
    />
  );
}

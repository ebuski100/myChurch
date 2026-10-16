export type AdminAccessDecision =
  | { status: "unauthenticated" }
  | { status: "forbidden"; userId: string }
  | { status: "authorized"; userId: string };

export function decideAdminAccess(
  authenticatedUserId: string | null,
  activeAdminUserId: string | null,
): AdminAccessDecision {
  if (!authenticatedUserId) return { status: "unauthenticated" };
  if (authenticatedUserId !== activeAdminUserId) {
    return { status: "forbidden", userId: authenticatedUserId };
  }
  return { status: "authorized", userId: authenticatedUserId };
}

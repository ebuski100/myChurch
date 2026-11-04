export type AdminRole = "primary" | "standard";

export type AdminRecord = {
  userId: string;
  role: AdminRole;
  isActive: boolean;
};

export type AdminAccessDecision =
  | { status: "unauthenticated" }
  | { status: "forbidden"; userId: string }
  | { status: "authorized"; userId: string; role: AdminRole };

/**
 * Decides whether an authenticated Supabase user may use the admin workspace.
 *
 * A row in `admin_users` is necessary but not sufficient: the account must also
 * be active. A deactivated administrator keeps their Auth session and their
 * `admin_users` row, so `is_active` has to be checked here — the RLS policies
 * on content tables only ask whether a row exists.
 */
export function decideAdminAccess(
  authenticatedUserId: string | null,
  admin: AdminRecord | null,
): AdminAccessDecision {
  if (!authenticatedUserId) return { status: "unauthenticated" };

  if (!admin) return { status: "forbidden", userId: authenticatedUserId };
  if (admin.userId !== authenticatedUserId) {
    return { status: "forbidden", userId: authenticatedUserId };
  }
  if (admin.isActive !== true) {
    return { status: "forbidden", userId: authenticatedUserId };
  }

  // Defensive: a role the schema does not allow must never be treated as a
  // privilege. `admin_users.role` is constrained to these two values, so this
  // only fires if the row was written outside the schema.
  if (admin.role !== "primary" && admin.role !== "standard") {
    return { status: "forbidden", userId: authenticatedUserId };
  }

  return { status: "authorized", userId: authenticatedUserId, role: admin.role };
}

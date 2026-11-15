/** Shared action state for the administrator password-recovery form. */
export type ResetPasswordActionState = {
  message?: string;
};

export type ForgotPasswordActionState = {
  step: "email" | "code";
  email?: string;
  message?: string;
};

export function isValidRecoveryEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export function isValidRecoveryOtp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (/^\d{6}$/.test(value) || /^\d{8}$/.test(value))
  );
}

export function isAuthorizedRecoveryAdmin(
  userId: string,
  admin: {
    user_id?: unknown;
    role?: unknown;
    is_active?: unknown;
  } | null,
): boolean {
  return (
    admin?.user_id === userId &&
    admin.is_active === true &&
    (admin.role === "primary" || admin.role === "standard")
  );
}

export function sanitizeAuthErrorMessage(
  value: unknown,
  password: string,
): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;

  const message = password
    ? value.split(password).join("[REDACTED]")
    : value;

  return message
    .replace(/\bBearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED]",
    )
    .replace(
      /\b(access_token|refresh_token|token|otp|password)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;}]+)/gi,
      "$1=[REDACTED]",
    )
    .replace(/\b\d{6,8}\b/g, "[REDACTED]")
    .slice(0, 300);
}

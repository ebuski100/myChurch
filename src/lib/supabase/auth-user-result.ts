import {
  isAuthSessionMissingError,
  type AuthError,
  type User,
} from "@supabase/supabase-js";

export function getVerifiedUserOrThrow(
  user: User | null,
  error: AuthError | null,
): User | null {
  if (error && isAuthSessionMissingError(error)) {
    return null;
  }

  if (error) {
    throw new Error("Supabase user identity could not be verified.", {
      cause: error,
    });
  }

  return user;
}

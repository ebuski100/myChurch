// Shared presentation helpers for department member biographies.
// Pure functions only: safe to import from client and server components.

export const MEMBER_BIOGRAPHY_PREVIEW_LENGTH = 120;

/**
 * Collapses whitespace and returns a short preview of a biography.
 * Returns null when there is nothing to show, and the full text when it
 * already fits. Longer text is cut at the last word boundary before the
 * limit so words are never split, with an ellipsis appended.
 */
export function truncateBiography(
  value: string | null,
  maxLength: number = MEMBER_BIOGRAPHY_PREVIEW_LENGTH,
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (normalized.length <= maxLength) return normalized;

  const candidate = normalized.slice(0, maxLength);
  const lastSpace = candidate.lastIndexOf(" ");
  const cut = lastSpace > 0 ? candidate.slice(0, lastSpace) : candidate;
  return `${cut.trimEnd()}...`;
}

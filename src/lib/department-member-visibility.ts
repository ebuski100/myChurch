// Pure, unit-testable publication and route rules for public member
// profiles. The database-backed fetch in department-public-member.ts
// reimplements these same gates in SQL; this module keeps the intent
// readable and tested in isolation.

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isMemberId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isSlug(value: string): boolean {
  return value.length > 0 && value.length <= 120
    && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

export type MemberPublicationInput = {
  publicationStatus: string;
  isPublic: boolean;
};

export type DepartmentPublicationInput = {
  publicationStatus: string;
  publishedAt: string | null;
  slug: string;
};

/**
 * Mirrors the public-profile gates: an approved, published member of a
 * published department whose publication date has arrived, with the member
 * id matching the URL and the department slug matching the URL.
 */
export function isMemberProfilePublic(
  member: MemberPublicationInput & { id: string },
  department: DepartmentPublicationInput,
  route: { slug: string; memberId: string },
  now: Date = new Date(),
): boolean {
  if (!isMemberId(route.memberId) || !isSlug(route.slug)) return false;
  if (member.id !== route.memberId) return false;
  if (member.publicationStatus !== "published" || !member.isPublic) {
    return false;
  }
  if (department.slug !== route.slug) return false;
  if (department.publicationStatus !== "published") return false;
  if (department.publishedAt === null) return false;
  const publishedAt = Date.parse(department.publishedAt);
  return (
    Number.isFinite(publishedAt) && publishedAt <= now.getTime()
  );
}

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDepartmentMemberPhotoUrls } from "@/lib/department-member-photo-storage";

export type PublishedDepartmentMemberProfile = {
  id: string;
  fullName: string;
  roleTitle: string | null;
  biography: string | null;
  photoUrl: string | null;
};

export type PublishedDepartmentMemberResult =
  | {
      kind: "success";
      departmentSlug: string;
      departmentName: string;
      member: PublishedDepartmentMemberProfile;
    }
  | { kind: "not_found" }
  | { kind: "error" };

type DepartmentMemberRow = {
  id: string;
  department_id: string;
  full_name: string;
  role_title: string | null;
  biography: string | null;
  photo_asset_id: string | null;
  publication_status: "draft" | "published" | "archived";
  is_public: boolean;
  departments:
    | {
        id: string;
        slug: string;
        name: string;
        publication_status: string;
        published_at: string | null;
      }
    | {
        id: string;
        slug: string;
        name: string;
        publication_status: string;
        published_at: string | null;
      }[]
    | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function first<T>(relation: T[] | T | null): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

/**
 * Fetches a single member for the public profile page. Every publication
 * gate is enforced server-side: the member must be published, explicitly
 * approved for public display, the member id must match, and the parent
 * department must be published with its publication date due. No slug or
 * id from the URL is ever trusted for membership — the profile is read
 * back joined to its real department and the two are compared.
 */
export async function getPublishedDepartmentMember(
  departmentSlug: string,
  memberId: string,
): Promise<PublishedDepartmentMemberResult> {
  const slug = departmentSlug.trim();
  if (!slug || slug.length > 120 || !isUuid(memberId)) {
    return { kind: "not_found" };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("department_members")
      .select(`
        id,
        department_id,
        full_name,
        role_title,
        biography,
        photo_asset_id,
        publication_status,
        is_public,
        departments!inner(id, slug, name, publication_status, published_at)
      `)
      .eq("id", memberId)
      .eq("publication_status", "published")
      .eq("is_public", true)
      .eq("departments.slug", slug)
      .eq("departments.publication_status", "published")
      .lte("departments.published_at", new Date().toISOString())
      .maybeSingle();

    if (error) return { kind: "error" };
    if (!data) return { kind: "not_found" };

    const row = data as unknown as DepartmentMemberRow;
    const department = first(row.departments);
    if (!department || department.id !== row.department_id) {
      return { kind: "not_found" };
    }

    let photoUrl: string | null = null;
    if (row.photo_asset_id) {
      const urls = await getDepartmentMemberPhotoUrls([
        row.photo_asset_id,
      ]);
      photoUrl = urls.get(row.photo_asset_id) ?? null;
    }

    return {
      kind: "success",
      departmentSlug: department.slug,
      departmentName: department.name,
      member: {
        id: row.id,
        fullName: row.full_name,
        roleTitle: row.role_title,
        biography: row.biography,
        photoUrl,
      },
    };
  } catch {
    return { kind: "error" };
  }
}

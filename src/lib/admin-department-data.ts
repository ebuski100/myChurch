import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { getDepartmentMemberPhotoUrls } from "@/lib/department-member-photo-storage";

export type AdminDepartmentMember = {
  id: string;
  departmentId: string;
  fullName: string;
  roleTitle: string | null;
  biography: string | null;
  photoAssetId: string | null;
  photoUrl: string | null;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  isPublic: boolean;
};

export type AdminDepartment = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  mission: string | null;
  meetingInformation: string | null;
  contactLabel: string | null;
  contactUrl: string | null;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  members: AdminDepartmentMember[];
};

export type AdminDepartmentsResult =
  | { kind: "success"; departments: AdminDepartment[] }
  | { kind: "error" };

const departmentSelection = `
  id, slug, name, short_description, description, mission,
  meeting_information, contact_label, contact_url, sort_order,
  publication_status, published_at,
  department_members(
    id, department_id, full_name, role_title, biography, photo_asset_id,
    sort_order, publication_status, is_public
  )
`;

type MemberRow = {
  id: string;
  department_id: string;
  full_name: string;
  role_title: string | null;
  biography: string | null;
  photo_asset_id: string | null;
  sort_order: number;
  publication_status: "draft" | "published" | "archived";
  is_public: boolean;
};

type DepartmentRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  mission: string | null;
  meeting_information: string | null;
  contact_label: string | null;
  contact_url: string | null;
  sort_order: number;
  publication_status: "draft" | "published" | "archived";
  published_at: string | null;
  department_members: MemberRow[] | MemberRow | null;
};

function asRows<T>(value: T[] | T | null): T[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export async function getAdminDepartments(): Promise<AdminDepartmentsResult> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase
      .from("departments")
      .select(departmentSelection)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data) return { kind: "error" };

    const rows = data as unknown as DepartmentRow[];
    const photoIds = rows.flatMap((row) => asRows(row.department_members).flatMap((member) => member.photo_asset_id ? [member.photo_asset_id] : []));
    const photoUrls = await getDepartmentMemberPhotoUrls(photoIds);
    const departments = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.short_description,
      description: row.description,
      mission: row.mission,
      meetingInformation: row.meeting_information,
      contactLabel: row.contact_label,
      contactUrl: row.contact_url,
      sortOrder: row.sort_order,
      status: row.publication_status,
      publishedAt: row.published_at,
      members: asRows(row.department_members)
        .map((member) => ({
          id: member.id,
          departmentId: member.department_id,
          fullName: member.full_name,
          roleTitle: member.role_title,
          biography: member.biography,
          photoAssetId: member.photo_asset_id,
          photoUrl: member.photo_asset_id ? photoUrls.get(member.photo_asset_id) ?? null : null,
          sortOrder: member.sort_order,
          status: member.publication_status,
          isPublic: member.is_public,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName)),
    }));

    return { kind: "success", departments };
  } catch {
    return { kind: "error" };
  }
}

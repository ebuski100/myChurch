import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDepartmentMemberPhotoUrls } from "@/lib/department-member-photo-storage";

export type PublicDepartmentMember = {
  id: string;
  fullName: string;
  roleTitle: string | null;
  biography: string | null;
  photoUrl: string | null;
};

export type PublicDepartment = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  mission: string | null;
  meetingInformation: string | null;
  contactLabel: string | null;
  contactUrl: string | null;
  members: PublicDepartmentMember[];
};

export type PublicDepartmentsResult =
  | { kind: "success"; departments: PublicDepartment[] }
  | { kind: "error" };
export type PublicDepartmentResult =
  | { kind: "success"; department: PublicDepartment }
  | { kind: "not_found" }
  | { kind: "error" };

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
  department_members?: MemberRow[] | MemberRow | null;
};
type MemberRow = {
  id: string;
  full_name: string;
  role_title: string | null;
  biography: string | null;
  photo_asset_id: string | null;
};

function normalizeMembers(value: DepartmentRow["department_members"]): MemberRow[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function mapDepartment(row: DepartmentRow, photoUrls: Map<string, string>): PublicDepartment {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    mission: row.mission,
    meetingInformation: row.meeting_information,
    contactLabel: row.contact_label,
    contactUrl: row.contact_url,
    members: normalizeMembers(row.department_members).map((member) => ({
      id: member.id,
      fullName: member.full_name,
      roleTitle: member.role_title,
      biography: member.biography,
      photoUrl: member.photo_asset_id ? photoUrls.get(member.photo_asset_id) ?? null : null,
    })),
  };
}

const departmentSelection = `
  id, slug, name, short_description, description, mission,
  meeting_information, contact_label, contact_url,
  department_members(id, full_name, role_title, biography, photo_asset_id)
`;

export async function getPublishedDepartments(): Promise<PublicDepartmentsResult> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("departments")
      .select(departmentSelection)
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .order("sort_order", { ascending: true });
    if (error || !data) return { kind: "error" };
    const rows = data as unknown as DepartmentRow[];
    const photoIds = rows.flatMap((row) => normalizeMembers(row.department_members).flatMap((member) => member.photo_asset_id ? [member.photo_asset_id] : []));
    const photoUrls = await getDepartmentMemberPhotoUrls(photoIds);
    return {
      kind: "success",
      departments: rows.map((row) => mapDepartment(row, photoUrls)),
    };
  } catch {
    return { kind: "error" };
  }
}

export async function getPublishedDepartment(
  slug: string,
): Promise<PublicDepartmentResult> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("departments")
      .select(departmentSelection)
      .eq("slug", slug)
      .eq("publication_status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error) return { kind: "error" };
    if (!data) return { kind: "not_found" };
    const row = data as unknown as DepartmentRow;
    const photoIds = normalizeMembers(row.department_members).flatMap((member) => member.photo_asset_id ? [member.photo_asset_id] : []);
    const photoUrls = await getDepartmentMemberPhotoUrls(photoIds);
    return {
      kind: "success",
      department: mapDepartment(row, photoUrls),
    };
  } catch {
    return { kind: "error" };
  }
}

import { redirect } from "next/navigation";

/**
 * The Ministries page was replaced by the Departments section. This
 * redirect keeps older links pointing at the section that superseded it.
 */
export default function LegacyMinistriesRedirect() {
  redirect("/departments");
}

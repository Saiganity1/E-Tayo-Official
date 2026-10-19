import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SuperAdminClient from "./SuperAdminClient";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const role = cookieStore.get("role")?.value;

  // 1. Role-based authorization gate: Staff and applicants are redirected
  if (role === "ROLE_STAFF") {
    redirect("/staff/dashboard");
  } else if (role === "ROLE_APPLICANT") {
    redirect("/applicant/dashboard");
  }

  // 2. Authorized SuperAdmin, Admin, or standalone login: Render control center shell
  return <SuperAdminClient />;
}

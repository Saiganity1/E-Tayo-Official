import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SuperAdminClient from "./SuperAdminClient";

export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const role = cookieStore.get("role")?.value;

  // 1. Unauthenticated gate: Redirect to /login
  if (!token) {
    redirect("/login?redirect=%2Fsuperadmin");
  }

  // 2. Role-based authorization gate: Only ROLE_SUPERADMIN is allowed
  if (role !== "ROLE_SUPERADMIN") {
    if (role === "ROLE_ADMIN") {
      redirect("/admin/dashboard");
    } else if (role === "ROLE_STAFF") {
      redirect("/staff/dashboard");
    } else {
      redirect("/applicant/dashboard");
    }
  }

  // 3. Authorized SuperAdmin: Render control center shell
  return <SuperAdminClient />;
}

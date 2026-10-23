import "server-only";
import { redirect } from "next/navigation";
import { authClient, isConfigured, serviceClient } from "./supabase-server";
export async function requireAdmin() {
  if (!isConfigured()) redirect("/admin/login");
  const auth = await authClient();
  const {
    data: { user },
    error,
  } = await auth.auth.getUser();
  if (error || !user) redirect("/admin/login");
  const db = serviceClient();
  const { data: role, error: profileError } = await auth.rpc("current_profile_role");
  if (profileError || role !== "admin")
    redirect("/admin/login?reason=role");
  return { db, user };
}

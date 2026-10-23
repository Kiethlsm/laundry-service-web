import "server-only";
import { redirect } from "next/navigation";
import { authClient, isConfigured } from "./supabase-server";
export async function requireCustomer() {
  if (!isConfigured()) redirect("/dang-nhap?reason=unavailable");
  const auth = await authClient();
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) redirect("/dang-nhap");
  const profile = await auth.rpc("current_profile_role");
  if (!profile.error && profile.data === "admin") redirect("/admin");
  if (profile.error || profile.data !== "customer") redirect("/dang-nhap?reason=role");
  return { auth, user: data.user };
}

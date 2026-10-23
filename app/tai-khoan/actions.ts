"use server";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase-server";
export async function customerSignOut() {
  const auth = await authClient();
  const { error } = await auth.auth.signOut({ scope: "local" });
  if (error) redirect("/tai-khoan?reason=logout");
  redirect("/dang-nhap");
}

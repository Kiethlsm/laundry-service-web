"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authClient, isConfigured, serviceClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin";
import { STATUS_LABEL, nextStatuses, type OrderStatus } from "@/lib/format";
export type ActionState = { error: string; success?: string };
export async function login(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!isConfigured())
    return {
      error:
        "Chưa kết nối Supabase. Vui lòng cấu hình môi trường trước khi đăng nhập.",
    };
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!email || !password || email.length > 254 || password.length > 256)
    return { error: "Nhập email và mật khẩu hợp lệ." };
  try {
    const auth = await authClient();
    const { data, error } = await auth.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user)
      return { error: "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại." };
    const { data: profile, error: profileError } = await serviceClient()
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    if (profileError || profile?.role !== "admin") {
      await auth.auth.signOut();
      return { error: "Tài khoản này chưa được cấp quyền quản trị." };
    }
  } catch {
    return {
      error: "Không kết nối được hệ thống đăng nhập. Vui lòng thử lại sau.",
    };
  }
  redirect("/admin");
}
export async function logout() {
  if (isConfigured()) {
    const auth = await authClient();
    await auth.auth.signOut();
  }
  redirect("/admin/login");
}
export async function updateStatus(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db, user } = await requireAdmin();
  const id = String(form.get("id") || "");
  const expected = String(form.get("expected") || "") as OrderStatus;
  const next = String(
    form.get("target") || form.get("next") || "",
  ) as OrderStatus;
  if (next === "cancelled" && form.get("confirm_cancel") !== "on")
    return { error: "Đánh dấu xác nhận trước khi hủy đơn." };
  if (
    !/^[a-f0-9-]{36}$/i.test(id) ||
    !Object.hasOwn(STATUS_LABEL, expected) ||
    !nextStatuses(expected).includes(next)
  )
    return { error: "Trạng thái chuyển tiếp không hợp lệ. Hãy tải lại đơn." };
  const { error } = await db.rpc("update_admin_order", {
    p_id: id,
    p_expected: expected,
    p_next: next,
    p_actor: user.id,
  });
  if (error)
    return {
      error: error.message.includes("ORDER_CHANGED")
        ? "Đơn vừa được cập nhật ở nơi khác. Hãy tải lại trang."
        : "Chưa cập nhật được đơn. Vui lòng thử lại.",
    };
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${id}`);
  return { error: "", success: `Đã cập nhật: ${STATUS_LABEL[next]}.` };
}

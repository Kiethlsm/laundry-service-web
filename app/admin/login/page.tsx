import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { isConfigured } from "@/lib/supabase-server";
export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const demo = !isConfigured();
  return (
    <div className="container page-space">
      <div className="login-panel">
        <h1>
          Chào người giữ
          <br />
          nếp sạch.
        </h1>
        <p>Đăng nhập để quản lý lịch hẹn và tiến độ đơn hàng.</p>
        {demo && (
          <div className="notice">
            Chưa kết nối Supabase. Quản trị viên cần cấu hình môi trường và tạo
            tài khoản theo README.
          </div>
        )}
        <LoginForm demo={demo} roleError={reason === "role"} />
        <p className="field-help">
          Khu vực dành cho quản trị viên.
          <br />
          Khách đặt lịch không cần đăng nhập.
        </p>
      </div>
    </div>
  );
}

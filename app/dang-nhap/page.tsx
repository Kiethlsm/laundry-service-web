import Link from "next/link";
import type { Metadata } from "next";
import { isConfigured } from "@/lib/supabase-server";
export const metadata: Metadata = { title: "Đăng nhập tài khoản", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function CustomerLogin({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const configured = isConfigured();
  const message = !configured || reason === "unavailable"
    ? "Đăng nhập Google chưa sẵn sàng. Bạn vẫn có thể đặt lịch không cần tài khoản."
    : reason === "failed" ? "Chưa đăng nhập được. Bạn hãy thử lại và chọn tài khoản Google của mình."
    : reason === "role" ? "Tài khoản này chưa truy cập được khu vực khách hàng. Vui lòng liên hệ tiệm." : "";
  return <div className="container page-space">
    <div className="login-panel customer-login">
      <h1>Lần giặt tới,<br />gặp lại dễ hơn.</h1>
      <p>Đăng nhập để xem những đơn bạn đã đặt bằng tài khoản của mình.</p>
      {message && <p className="form-error" role="alert">{message}</p>}
      {configured ? <a href="/auth/google" className="button full-button" data-google-login>Tiếp tục với Google <span aria-hidden="true">↗</span></a>
        : <button className="button full-button" disabled>Tiếp tục với Google</button>}
      <p className="field-help">Không cần tạo mật khẩu riêng. Sạch Sạch không yêu cầu quyền đọc thư Gmail của bạn.</p>
      <div className="customer-login-links"><Link className="text-link" href="/dat-lich">Đặt lịch không cần đăng nhập</Link><Link className="text-link" href="/tra-cuu">Tra cứu đơn đã có</Link></div>
      <p className="field-help">Đơn từng đặt không đăng nhập vẫn tra cứu bằng mã đơn và số điện thoại; chúng không tự chuyển vào tài khoản.</p>
      <Link className="text-link customer-admin-link" href="/admin/login">Quản lý tiệm</Link>
    </div>
  </div>;
}

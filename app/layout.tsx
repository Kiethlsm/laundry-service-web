import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "@fontsource/be-vietnam-pro/vietnamese-800.css";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "@fontsource/be-vietnam-pro/latin-800.css";
import "./globals.css";
import "./home.css";
import { Header } from "@/components/header";
import { Arrow, Brand } from "@/components/ui";

export const metadata: Metadata = {
  title: {
    default: "Sạch Sạch — Nhẹ việc giặt, thêm thời gian",
    template: "%s | Sạch Sạch",
  },
  description:
    "Demo dịch vụ giặt sấy, giặt giày, mền chăn, ủi đồ, sửa đồ và giặt gấu bông. Đặt lịch lấy đồ không cần tài khoản.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <a className="skip-link" href="#noi-dung">
          Đến nội dung chính
        </a>
        <Header />
        <main id="noi-dung">{children}</main>
        <footer>
          <div className="container footer-grid">
            <div className="footer-brand">
              <Link href="/" aria-label="Sạch Sạch, trang chủ">
                <Brand />
              </Link>
              <p>Nhẹ việc giặt, thêm thời gian.</p>
              <span className="demo-label">
                Dự án demo · Thông tin tiệm minh họa
              </span>
            </div>
            <div>
              <h3>Ghé Sạch Sạch</h3>
              <p>
                123 Đường Mẫu, TP. Hồ Chí Minh
                <br />
                08:00 – 20:00, Thứ Hai – Chủ Nhật
                <br />
                SĐT minh họa: 0900 000 000
              </p>
            </div>
            <div>
              <h3>Bạn cần gì?</h3>
              <Link href="/bang-gia">Xem bảng giá</Link>
              <Link href="/dat-lich">Đặt lịch lấy đồ</Link>
              <Link href="/tra-cuu">Tra cứu đơn hàng</Link>
            </div>
          </div>
          <div className="container footer-bottom">
            <span>© 2026 Sạch Sạch. Website minh họa cho CV.</span>
            <Link href="/admin">
              Dành cho quản trị viên <Arrow />
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}

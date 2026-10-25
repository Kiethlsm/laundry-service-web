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
import "./admin-ui.css";
import "./home-refresh.css";
import { Header } from "@/components/header";
import { Arrow, Brand } from "@/components/ui";
import { ShopContact } from "@/components/shop-contact";

export const metadata: Metadata = {
  title: {
    default: "Sạch Sạch — Nhẹ việc giặt, thêm thời gian",
    template: "%s | Sạch Sạch",
  },
  description:
    "Dịch vụ giặt sấy, giặt giày, mền chăn, ủi đồ, sửa đồ và giặt gấu bông. Đặt lịch lấy đồ và theo dõi đơn cùng Sạch Sạch.",
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
            </div>
            <ShopContact />
            <div>
              <h3>Bạn cần gì?</h3>
              <Link href="/bang-gia">Xem bảng giá</Link>
              <Link href="/dat-lich">Đặt lịch lấy đồ</Link>
              <Link href="/tra-cuu">Tra cứu đơn hàng</Link>
            </div>
          </div>
          <div className="container footer-bottom">
            <span>© 2026 Sạch Sạch.</span>
            <Link href="/admin">
              Dành cho quản trị viên <Arrow />
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Arrow, Brand } from "./ui";
import { NavigationHint } from "./navigation-hint";
export function Header() {
  const path = usePathname();
  const admin = path.startsWith("/admin") && path !== "/admin/login";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  return (
    <header
      className="site-header"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) { setOpen(false); menuRef.current?.focus(); }
      }}
    >
      <div className="container header-inner">
        <Link
          href={admin ? "/admin" : "/"}
          aria-label={admin ? "Sạch Sạch, quản lý tiệm" : "Sạch Sạch, trang chủ"}
          onClick={() => setOpen(false)}
        >
          <Brand />
          <NavigationHint />
        </Link>
        <button
          ref={menuRef}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? "Đóng menu" : "Menu"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path d={open ? "M5 12h14" : "M5 12h14M12 5v14"} />
          </svg>
        </button>
        <nav
          id="main-nav"
          className={open ? "navigation is-open" : "navigation"}
          aria-label="Điều hướng chính"
        >
          {(admin ? [["/admin", "Đơn hàng"], ["/", "Xem cửa hàng"]] : [
            ["/", "Trang chủ"],
            ["/bang-gia", "Bảng giá"],
            ["/dat-lich", "Đặt lịch"],
            ["/tra-cuu", "Tra cứu đơn"],
            ["/tai-khoan", "Tài khoản"],
          ]).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              prefetch={!admin && ["/", "/bang-gia", "/dat-lich", "/tra-cuu"].includes(href) ? true : undefined}
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
              <NavigationHint />
            </Link>
          ))}
        </nav>
        {!admin && <Link className="button header-cta" href="/dat-lich" prefetch={true}>
          Đặt lịch lấy đồ <Arrow /><NavigationHint />
        </Link>}
      </div>
    </header>
  );
}

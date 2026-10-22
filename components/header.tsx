"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Arrow, Brand } from "./ui";
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header
      className="site-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="container header-inner">
        <Link
          href="/"
          aria-label="Sạch Sạch, trang chủ"
          onClick={() => setOpen(false)}
        >
          <Brand />
        </Link>
        <button
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
          {[
            ["/", "Trang chủ"],
            ["/bang-gia", "Bảng giá"],
            ["/dat-lich", "Đặt lịch"],
            ["/tra-cuu", "Tra cứu đơn"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="button header-cta" href="/dat-lich">
          Đặt lịch lấy đồ <Arrow />
        </Link>
      </div>
    </header>
  );
}

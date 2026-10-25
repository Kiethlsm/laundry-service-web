"use client";

import { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";

export function NavigationHint() {
  const { pending } = useLinkStatus();
  if (!pending || typeof document === "undefined") return null;
  // Keep feedback visible when selecting a link closes the mobile menu.
  return createPortal(
    <div className="navigation-pending" role="status">Đang mở trang…</div>,
    document.body,
  );
}

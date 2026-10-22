import { STATUS_LABEL, type OrderStatus } from "@/lib/format";
export function Arrow() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
export function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="34" height="34" rx="11" fill="currentColor" />
        <circle cx="18" cy="20" r="9" stroke="var(--paper)" strokeWidth="2" />
        <path d="M10 20c4-5 12 5 16 0" stroke="var(--paper)" strokeWidth="2" />
        <path
          d="M10 7h6m9 0h1"
          stroke="var(--paper)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>
        sạch sạch<span className="brand-period">.</span>
      </span>
    </span>
  );
}
export function ServiceEmoji({ id }: { id: number }) {
  return (
    <span className="service-emoji" aria-hidden="true">
      {["🧺", "👟", "🛏️", "👔", "🪡", "🧸"][(id - 1) % 6]}
    </span>
  );
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status status-${status}`}>{STATUS_LABEL[status]}</span>
  );
}
export function PreviewNotice() {
  return (
    <div className="notice" role="status">
      Đây là bản xem trước với bảng giá mẫu. Hiện chưa tiếp nhận lịch hẹn và
      chưa hỗ trợ tra cứu đơn.
    </div>
  );
}

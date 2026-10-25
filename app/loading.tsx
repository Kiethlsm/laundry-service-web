export default function Loading() {
  return (
    <div
      className="container page-space skeleton-page"
      role="status"
      aria-label="Đang tải nội dung"
    >
      <p>Đang mở trang…</p>
      <div aria-hidden="true" />
      <div aria-hidden="true" />
      <div aria-hidden="true" />
    </div>
  );
}

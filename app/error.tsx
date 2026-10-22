"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page-space error-page">
      <h1>Chưa tải được nội dung.</h1>
      <p>
        Kết nối đến cửa hàng đang gián đoạn. Bạn có thể thử lại sau ít phút.
      </p>
      <div className="actions">
        <button className="button" onClick={reset}>
          Thử tải lại
        </button>
        <Link className="text-link" href="/">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

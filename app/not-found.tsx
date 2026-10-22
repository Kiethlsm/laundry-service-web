import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page-space error-page">
      <h1>Trang này đi giặt mất rồi.</h1>
      <p>
        Đường dẫn không tồn tại. Bạn có thể quay về để đặt lịch hoặc xem bảng
        giá.
      </p>
      <Link className="button" href="/">
        Về trang chủ
      </Link>
    </div>
  );
}

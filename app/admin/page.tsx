import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import {
  STATUS_LABEL,
  formatVND,
  formatDate,
  type OrderStatus,
} from "@/lib/format";
import { StatusBadge, Arrow } from "@/components/ui";
import { logout } from "./actions";
export const metadata: Metadata = {
  title: "Quản lý đơn hàng",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { db } = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 24) : "";
  const status =
    params.status && Object.hasOwn(STATUS_LABEL, params.status)
      ? (params.status as OrderStatus)
      : "";
  let query = db
    .from("orders")
    .select("id,code,customer_name,customer_phone,total,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  const validSearch = /^[a-zA-Z0-9]+$/.test(q);
  if (q && validSearch)
    query = query.or(`code.ilike.%${q}%,customer_phone.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw new Error("Không tải được danh sách đơn.");
  const orders = q && !validSearch ? [] : data;
  return (
    <div className="container page-space">
      <div className="admin-heading">
        <div>
          <h1>Đơn hàng</h1>
          <p>Những lịch hẹn cần bạn chăm chút hôm nay.</p>
        </div>
        <form action={logout}>
          <button className="text-button">Đăng xuất ↗</button>
        </form>
      </div>
      <form className="filter-form" method="get">
        <label>
          Tìm mã đơn / SĐT
          <input
            name="q"
            defaultValue={q}
            maxLength={24}
            placeholder="LD1001 hoặc 090…"
          />
        </label>
        <label>
          Trạng thái
          <select name="status" defaultValue={status}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="button">Lọc đơn hàng</button>
        <Link className="text-link" href="/admin">
          Đặt lại
        </Link>
      </form>
      <p className="field-help">
        Hiển thị tối đa 100 đơn mới nhất khớp bộ lọc · {orders.length} kết quả.
      </p>
      {orders.length ? (
        <div
          className="table-scroll"
          role="region"
          aria-label="Danh sách đơn hàng"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>
                  <span className="sr-only">Chi tiết</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link className="order-link" href={`/admin/orders/${o.id}`}>
                      {o.code}
                    </Link>
                  </td>
                  <td>{o.customer_name}</td>
                  <td>{o.customer_phone}</td>
                  <td className="money">{formatVND(Number(o.total))}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>
                    <Link
                      className="icon-link"
                      href={`/admin/orders/${o.id}`}
                      aria-label={`Xem đơn ${o.code}`}
                    >
                      <Arrow />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h2>Chưa có đơn phù hợp.</h2>
          <p>
            Thử đổi bộ lọc hoặc tìm bằng mã đơn / SĐT. Đơn mới sẽ xuất hiện khi
            khách đặt lịch.
          </p>
          <Link className="text-link" href="/admin">
            Xóa bộ lọc <Arrow />
          </Link>
        </div>
      )}
    </div>
  );
}

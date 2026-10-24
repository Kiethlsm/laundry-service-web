"use client";
import Link from "next/link";
import { useState } from "react";
import { ORDER_GROUPS, groupForStatus } from "@/lib/admin-operations";
import { formatDate, formatVND, type OrderStatus } from "@/lib/format";
import { StatusBadge } from "./ui";
export type OrderSummary = {
  id: string; code: string; customer_name: string; customer_phone: string;
  total: number; status: OrderStatus; created_at: string; pickup_time: string | null; pickup_address: string;
};
export function AdminOrders({ orders, q }: { orders: OrderSummary[]; q: string }) {
  const [group, setGroup] = useState("all");
  const matching = q ? orders.filter(o => [o.code, o.customer_phone].some(v => v.toLowerCase().includes(q.toLowerCase()))) : orders;
  const visible = group === "all" ? matching : matching.filter(o => groupForStatus(o.status) === group);
  return <section className="admin-order-board" aria-label="Đơn hàng của tiệm">
    <div className="order-group-switcher" role="group" aria-label="Nhóm đơn hàng">
      {ORDER_GROUPS.slice(0, 4).map(g => <button key={g.id} type="button" data-group={g.id} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}><span>{g.label}</span><strong>{matching.filter(o => g.statuses.includes(o.status)).length}</strong></button>)}
    </div>
    <div className="admin-list-heading">
      <div><h2>{group === "all" ? "Tất cả đơn hàng" : ORDER_GROUPS.find(g => g.id === group)?.label}</h2><p role="status">{visible.length} đơn · trong tối đa 100 đơn mới nhất khớp tìm kiếm.</p></div>
      <div className="admin-list-tools" role="group" aria-label="Xem thêm đơn hàng">
        <button type="button" className="text-button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>Tất cả</button>
        <button type="button" className="text-button" aria-pressed={group === "cancelled"} onClick={() => setGroup("cancelled")}>Đã hủy ({matching.filter(o => o.status === "cancelled").length})</button>
      </div>
    </div>
    {visible.length ? <ul className="admin-order-list">{visible.map(o => <li key={o.id} className="admin-order-row">
      <div className="admin-order-id"><Link className="order-link" href={"/admin/orders/" + o.id}>{o.code}</Link><StatusBadge status={o.status} /></div>
      <div className="admin-order-customer"><strong>{o.customer_name}</strong><a href={"tel:" + o.customer_phone.replace(/[^\d+]/g, "")}>{o.customer_phone}</a></div>
      <div className="admin-order-pickup"><span>Lịch lấy đồ</span><strong>{formatDate(o.pickup_time)}</strong><p>{o.pickup_address}</p></div>
      <div className="admin-order-total"><span>Chi phí hiện tại</span><strong>{formatVND(Number(o.total))}</strong></div>
      <Link className="admin-open-order" href={"/admin/orders/" + o.id} aria-label={"Mở đơn " + o.code}>Mở đơn <span aria-hidden="true">→</span></Link>
    </li>)}</ul> : <div className="admin-empty"><h3>{matching.length ? "Nhóm này chưa có đơn." : "Chưa có đơn phù hợp."}</h3><p>{matching.length ? "Chọn nhóm khác hoặc xem tất cả đơn đang có." : "Đơn mới sẽ hiện tại đây khi khách đặt lịch. Bạn cũng có thể tìm lại bằng mã đơn hoặc số điện thoại."}</p>{group !== "all" && <button type="button" className="button" onClick={() => setGroup("all")}>Xem tất cả đơn</button>}</div>}
  </section>;
}

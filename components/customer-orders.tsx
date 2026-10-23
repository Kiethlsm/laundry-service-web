import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { formatDate, formatVND, type OrderStatus } from "@/lib/format";
export type CustomerOrder = { id: string; code: string; status: OrderStatus; total: number; created_at: string };
export function CustomerOrders({ orders }: { orders: CustomerOrder[] }) {
  return <section data-customer-orders aria-labelledby="customer-orders-heading">
    <h2 id="customer-orders-heading">Đơn của bạn</h2>
    {orders.length ? <><p className="field-help">Tối đa 50 đơn gần nhất đặt bằng tài khoản này. Số tiền có thể thay đổi sau khi tiệm cân và chốt giá.</p><div className="table-scroll" role="region" aria-label="Đơn đã đặt" tabIndex={0}><table><caption className="sr-only">Lịch sử đơn của tài khoản đang đăng nhập</caption><thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Trạng thái</th><th>Số tiền</th></tr></thead><tbody>{orders.map(order=><tr key={order.id}><td><strong>{order.code}</strong></td><td>{formatDate(order.created_at)}</td><td><StatusBadge status={order.status}/></td><td className="money">{formatVND(order.total)}</td></tr>)}</tbody></table></div></>
      : <div className="empty-state"><h3>Chưa có đơn trong tài khoản</h3><p>Lịch hẹn mới đặt khi đăng nhập sẽ xuất hiện ở đây.</p><Link className="button" href="/dat-lich">Đặt lịch giặt đầu tiên <span aria-hidden="true">↗</span></Link></div>}
    <p className="field-help">Có đơn từng đặt không đăng nhập? <Link className="text-link" href="/tra-cuu">Tra cứu bằng mã đơn và số điện thoại</Link>.</p>
  </section>;
}

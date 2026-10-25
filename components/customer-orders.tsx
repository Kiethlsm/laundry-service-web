import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { formatDate, formatVND, type OrderStatus } from "@/lib/format";
export type CustomerOrder = { id: string; code: string; status: OrderStatus; total: number; created_at: string };
export function CustomerOrders({ orders }: { orders: CustomerOrder[] }) {
  return <section data-customer-orders aria-labelledby="customer-orders-heading">
    <h2 id="customer-orders-heading">Đơn của bạn</h2>
    {orders.length ? <><p className="field-help">Tối đa 50 đơn gần nhất đặt bằng tài khoản này. Mở từng đơn để xem tiến độ và chi phí hiện tại.</p><ul className="customer-orders-list">{orders.map(order=><li key={order.id}>
      <div className="customer-order-code"><Link href={`/tai-khoan/don/${order.id}`}>{order.code}</Link><StatusBadge status={order.status}/></div>
      <dl><div><dt>Ngày đặt</dt><dd>{formatDate(order.created_at)}</dd></div><div><dt>Thành tiền hiện tại</dt><dd className="customer-order-amount">{formatVND(order.total)}</dd></div></dl>
      <Link className="text-link customer-view-order" href={`/tai-khoan/don/${order.id}`}>Xem đơn <span aria-hidden="true">→</span></Link>
    </li>)}</ul></>
      : <div className="empty-state"><h3>Chưa có đơn trong tài khoản</h3><p>Lịch hẹn mới đặt khi đăng nhập sẽ xuất hiện ở đây.</p><Link className="button" href="/dat-lich">Đặt lịch giặt đầu tiên <span aria-hidden="true">→</span></Link></div>}
    <p className="field-help">Có đơn từng đặt không đăng nhập? <Link className="text-link" href="/tra-cuu">Tra cứu bằng mã đơn và số điện thoại</Link>.</p>
  </section>;
}

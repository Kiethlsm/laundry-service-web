import { formatDate, formatVND, STATUS_LABEL, UNIT_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";
import { StatusBadge } from "./ui";
import { BankTransfer } from "./bank-transfer";
export function OrderDetail({ order }: { order: Order }) {
  const history = [...order.order_status_history].sort(
    (a, b) => a.changed_at.localeCompare(b.changed_at) || a.id - b.id,
  );
  return (
    <div className="order-detail">
      <div className="order-detail-heading">
        <div>
          <p>Đơn hàng của {order.customer_name}</p>
          <h2>{order.code}</h2>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="detail-columns">
        <section>
          <h3>Thông tin lấy & giao đồ</h3>
          <dl className="detail-list">
            <div>
              <dt>Địa chỉ lấy đồ</dt>
              <dd>{order.pickup_address}</dd>
            </div>
            <div>
              <dt>Lịch lấy đồ</dt>
              <dd>{formatDate(order.pickup_time)}</dd>
            </div>
            {order.delivery_time && (
              <div>
                <dt>Đã giao lúc</dt>
                <dd>{formatDate(order.delivery_time)}</dd>
              </div>
            )}
            <div>
              <dt>Ngày đặt</dt>
              <dd>{formatDate(order.created_at)}</dd>
            </div>
            <div>
              <dt>Thanh toán</dt>
              <dd>
                {order.payment_method === "cash"
                  ? "Tiền mặt khi nhận đồ"
                  : "Chuyển khoản khi nhận đồ"}
              </dd>
            </div>
            {order.note && (
              <div>
                <dt>Ghi chú</dt>
                <dd>{order.note}</dd>
              </div>
            )}
          </dl>
          <h3>Dịch vụ đã chọn</h3>
          <ul className="detail-items">
            {order.order_items.map((item, i) => (
              <li key={i}>
                <div>
                  <strong>{item.services?.name || "Dịch vụ"}</strong>
                  <span>
                    {Number(item.quantity)}{" "}
                    {UNIT_LABEL[item.services?.unit || "cai"]} ×{" "}
                    {formatVND(Number(item.unit_price))}
                  </span>
                </div>
                <strong>
                  {formatVND(
                    Math.round(Number(item.quantity) * Number(item.unit_price)),
                  )}
                </strong>
              </li>
            ))}
          </ul>
          <div className="summary-total">
            <span>Tổng tiền</span>
            <strong>{formatVND(Number(order.total))}</strong>
          </div>
          <p className="field-help">
            Theo khối lượng ước tính khi đặt. Cửa hàng xác nhận chi phí thực tế
            trước khi xử lý.
          </p>
        </section>
        <section className="timeline-section">
          <h3>Hành trình đồ sạch</h3>
          <ol className="timeline">
            {history.map((entry, i) => (
              <li
                key={entry.id}
                className={i === history.length - 1 ? "current" : ""}
              >
                <span className="timeline-point" aria-hidden="true" />
                <strong>{STATUS_LABEL[entry.status]}</strong>
                <time dateTime={entry.changed_at}>
                  {formatDate(entry.changed_at)}
                </time>
              </li>
            ))}
          </ol>
          {history.length === 0 && <p>Chưa có lịch sử trạng thái.</p>}
        </section>
      </div>
      {order.payment_method === "bank_transfer" && !["cancelled", "delivered"].includes(order.status) && (
        <details className="bank-transfer-admin">
          <summary>QR và thông tin nhận chuyển khoản</summary>
          <BankTransfer amount={Number(order.total)} orderCode={order.code} />
          <p className="field-help">Đối chiếu số dư còn phải thu trong sổ tiền trước khi ghi nhận. Thông tin QR này không xác minh giao dịch ngân hàng.</p>
        </details>
      )}
    </div>
  );
}

"use client";
import { useRef, useState } from "react";
import { formatVND, STATUS_LABEL, type OrderStatus } from "@/lib/format";
import { Arrow } from "./ui";
import { OrderProgress } from "./order-progress";
import { SHOP } from "@/lib/shop";
export function TrackForm({
  initialCode,
  demo,
}: {
  initialCode: string;
  demo: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<{code:string;status:OrderStatus;total:number} | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          code: form.get("code"),
          phone: form.get("phone"),
        }),
      });
      if (!response.ok) {
        setError(response.status === 404 ? "Không tìm thấy đơn khớp mã và số điện thoại. Bạn hãy kiểm tra lại cả hai thông tin." : response.status === 400 ? "Kiểm tra mã đơn và số điện thoại 10 chữ số đã đặt lịch." : response.status === 429 ? "Bạn đã tra cứu nhiều lần. Hãy chờ một chút rồi thử lại." : "Kết nối đến tiệm đang gián đoạn. Bạn hãy thử lại sau ít phút.");
        return;
      }
      const result = await response.json();
      if (!result || !/^LD\d+$/.test(result.code) || !Object.hasOwn(STATUS_LABEL,result.status) || !Number.isSafeInteger(result.total) || result.total<0) throw new Error("INVALID_RESULT");
      setOrder(result);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      setError("Kết nối tra cứu đang gián đoạn. Bạn hãy thử lại; nếu cần gấp, gọi tiệm để hỏi đơn.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="track-form" onSubmit={submit}>
        <label>
          Mã đơn hàng
          <input
            name="code"
            required
            maxLength={18}
            defaultValue={initialCode}
            placeholder="Ví dụ: LD1001"
            autoCapitalize="characters"
            autoComplete="off"
            disabled={busy}
          />
        </label>
        <label>
          Số điện thoại đặt lịch
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            pattern="0[0-9]{9}"
            maxLength={10}
            placeholder="0901234567"
            title="10 chữ số, bắt đầu bằng 0"
            disabled={busy}
          />
        </label>
        <button className="button" disabled={busy || demo}>
          {busy ? "Đang tra cứu…" : "Tra cứu đơn"}
          {!busy && <Arrow />}
        </button>
        {error && (
          <p className="form-error full-width" role="alert">
            {error}
          </p>
        )}
      </form>
      {order ? (
        <div ref={resultRef} tabIndex={-1} className="customer-track-result">
          <h2>{order.code}</h2>
          <p>{STATUS_LABEL[order.status]} · {formatVND(order.total)}</p>
          <OrderProgress status={order.status}/>
          <a className="text-link" href={`tel:${SHOP.phone}`}>Hỏi về đơn · {SHOP.phone}</a>
          <p className="field-help">Tra cứu công khai chỉ hiển thị tiến độ và số tiền; không hiển thị địa chỉ, liên hệ hay bằng chứng nội bộ.</p>
          <p className="field-help track-help">
            Muốn cập nhật tiến độ? Nhấn “Tra cứu đơn” lần nữa.
          </p>
        </div>
      ) : (
        !error && (
          <div className="track-empty">
            <div className="track-symbol" aria-hidden="true">
              <svg
                viewBox="0 0 48 48"
                width="48"
                height="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="10" y="5" width="28" height="38" rx="4" />
                <path d="M17 15h14M17 22h10M17 29h7" />
                <circle cx="32" cy="32" r="7" />
                <path d="m37 37 6 6" />
              </svg>
            </div>
            <h2>Mỗi đơn đồ, một hành trình.</h2>
            <p>
              Mã đơn được hiển thị sau khi đặt lịch thành công.
              <br />
              Thông tin chỉ xuất hiện khi mã đơn và SĐT cùng khớp.
            </p>
          </div>
        )
      )}
    </>
  );
}

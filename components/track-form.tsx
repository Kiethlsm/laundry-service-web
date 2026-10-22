"use client";
import { useRef, useState } from "react";
import type { Order } from "@/lib/types";
import { OrderDetail } from "./order-detail";
import { Arrow } from "./ui";
export function TrackForm({
  initialCode,
  demo,
}: {
  initialCode: string;
  demo: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
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
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Chưa thể tra cứu. Vui lòng thử lại.");
      setOrder(result);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Mất kết nối. Hãy thử lại.",
      );
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
        <div ref={resultRef} tabIndex={-1}>
          <OrderDetail order={order} />
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

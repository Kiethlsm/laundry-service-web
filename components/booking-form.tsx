"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { formatVND, UNIT_LABEL } from "@/lib/format";
import type { Category, Service } from "@/lib/types";
import { Arrow, ServiceEmoji } from "./ui";
import { BankTransfer } from "./bank-transfer";

function isFuturePickup(pickup: Date) {
  const timestamp = pickup.getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export function BookingForm({
  categories,
  services,
  demo,
  initialCategory,
}: {
  categories: Category[];
  services: Service[];
  demo: boolean;
  initialCategory?: string;
}) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [operationKey] = useState(() => crypto.randomUUID());
  const [toleranceConsent, setToleranceConsent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [active, setActive] = useState(
    categories.find((c) => c.slug === initialCategory)?.id || categories[0]?.id,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    code: string;
    total: number;
  } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const chosen = services.filter((s) => (quantities[s.id] || 0) > 0);
  const total = chosen.reduce((sum, s) => sum + Math.round(s.price * quantities[s.id]), 0);
  const maximum = chosen.reduce((sum, s) => sum + Math.round(s.price * (quantities[s.id] + (toleranceConsent && s.unit === "kg" ? Math.max(quantities[s.id] * .1, .3) : 0))), 0);
  const setQuantity = (id: number, value: string) =>
    setQuantities((current) => ({ ...current, [id]: value === "" ? 0 : Number(value) }));
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (Object.entries(quantities).some(([id, q]) => !Number.isFinite(q) || q < 0 || q > 1000 || Math.abs(q * 100 - Math.round(q * 100)) > .000001 || (services.find(s => s.id === Number(id))?.unit !== "kg" && !Number.isInteger(q)))) {
      setError("Kiểm tra số lượng ở tất cả nhóm: tối đa 1.000, số món phải nguyên, kg tối đa hai số lẻ.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (!chosen.length) {
      setError(
        "Bạn chưa chọn dịch vụ. Hãy nhập số lượng cho ít nhất một món đồ.",
      );
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    const form = new FormData(e.currentTarget);
    const pickup = new Date(String(form.get("pickup")));
    if (!isFuturePickup(pickup)) {
      setError("Chọn thời gian lấy đồ trong tương lai.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": operationKey },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          address: form.get("address"),
          pickup: pickup.toISOString(),
          payment: form.get("payment"),
          note: form.get("note"),
          consent: form.get("consent") === "on",
          tolerance_consent: form.get("tolerance_consent") === "on",
          items: chosen.map((s) => ({
            service_id: s.id,
            quantity: quantities[s.id],
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(response.status === 409 ? "Nội dung đã thay đổi so với lần gửi trước. Hãy tải lại để đặt lịch mới." : response.status === 429 ? "Bản demo đã đạt giới hạn đặt lịch. Vui lòng thử lại sau." : "Chưa thể đặt lịch. Vui lòng kiểm tra thông tin rồi thử lại.");
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }
      if (!result || !/^LD\d+$/.test(result.code) || !Number.isSafeInteger(result.total) || result.total < 0 || !Number.isSafeInteger(result.max_weight_total) || result.max_weight_total < result.total) throw new Error("INVALID_RESULT");
      setSuccess(result);
      requestAnimationFrame(() => {
        successRef.current?.focus();
        successRef.current?.scrollIntoView({
          block: paymentMethod === "bank_transfer" ? "start" : "center",
          behavior: "smooth",
        });
      });
    } catch {
      setError("Chưa xác nhận được kết quả. Giữ nguyên thông tin và thử lại; phiên này không tạo trùng đơn.");
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="success-panel" ref={successRef} tabIndex={-1}>
        <span className="success-mark" aria-hidden="true">
          ✓
        </span>
        <h2>Đã nhận lịch hẹn của bạn!</h2>
        <p>Lưu mã đơn bên dưới. Dùng mã và SĐT đã đặt để theo dõi tiến độ.</p>
        <strong className="order-code">{success.code}</strong>
        <p>
          Tạm tính: <strong>{formatVND(success.total)}</strong>
        </p>
        <p>Cửa hàng sẽ liên hệ để xác nhận lịch lấy và khối lượng thực tế.</p>
        {paymentMethod === "bank_transfer" && <BankTransfer amount={success.total} orderCode={success.code} />}
        <Link className="button" href={`/tra-cuu?ma=${success.code}`}>
          Theo dõi đơn hàng <Arrow />
        </Link>
        <Link className="text-link" href="/">
          Về trang chủ
        </Link>
      </div>
    );
  return (
    <form className="booking-layout" onSubmit={submit}>
      <div className="booking-main">
        <section className="form-section">
          <div className="form-section-heading">
            <span>1</span>
            <h2>Bạn cần chăm những gì?</h2>
          </div>
          <p className="field-help">
            Nhập số lượng ước tính. Với dịch vụ theo kg, bạn có thể nhập số lẻ.
          </p>
          <div
            className="category-nav booking-tabs"
            role="group"
            aria-label="Chọn nhóm dịch vụ"
          >
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                aria-pressed={active === c.id}
                onClick={() => setActive(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="booking-services">
            {services
              .filter((s) => s.category_id === active)
              .map((s) => (
                <div className="booking-service" key={s.id}>
                  <div>
                    <label htmlFor={`qty-${s.id}`}>{s.name}</label>
                    <p>
                      {formatVND(s.price)} / {UNIT_LABEL[s.unit]}{" "}
                      <span>· {s.est_hours} giờ</span>
                    </p>
                  </div>
                  <div className="quantity-input">
                    <input
                      id={`qty-${s.id}`}
                      type="number"
                      min="0"
                      max="1000"
                      step={s.unit === "kg" ? "0.01" : "1"}
                      inputMode="decimal"
                      value={quantities[s.id] || ""}
                      placeholder="0"
                      onChange={(e) => setQuantity(s.id, e.target.value)}
                      aria-label={`Số lượng ${s.name}`}
                      disabled={busy}
                    />
                    <span>{UNIT_LABEL[s.unit]}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
        <section className="form-section">
          <div className="form-section-heading">
            <span>2</span>
            <h2>Chúng mình lấy đồ ở đâu?</h2>
          </div>
          <div className="field-grid">
            <label>
              Họ và tên <span aria-hidden="true">*</span>
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Nguyễn An"
                disabled={busy}
              />
            </label>
            <label>
              Số điện thoại <span aria-hidden="true">*</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel-national"
                inputMode="tel"
                required
                pattern="0[0-9]{9}"
                maxLength={10}
                placeholder="0901234567"
                title="10 chữ số, bắt đầu bằng 0"
                disabled={busy}
              />
            </label>
            <label className="full-width">
              Địa chỉ lấy đồ <span aria-hidden="true">*</span>
              <input
                name="address"
                autoComplete="street-address"
                required
                minLength={5}
                maxLength={500}
                placeholder="Số nhà, tên đường, phường, quận…"
                disabled={busy}
              />
            </label>
            <label className="full-width">
              Thời gian lấy đồ <span aria-hidden="true">*</span>
              <input
                name="pickup"
                type="datetime-local"
                required
                disabled={busy}
              />
              <span className="field-help">
                Theo múi giờ trên thiết bị của bạn. Cửa hàng sẽ gọi xác nhận
                lịch hẹn.
              </span>
            </label>
          </div>
        </section>
        <section className="form-section">
          <div className="form-section-heading">
            <span>3</span>
            <h2>Thêm một vài chi tiết</h2>
          </div>
          <fieldset className="payment-options">
            <legend>Thanh toán khi nhận đồ</legend>
            <label>
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
                disabled={busy}
              />
              <span>Tiền mặt</span>
            </label>
            <label>
              <input
                type="radio"
                name="payment"
                value="bank_transfer"
                checked={paymentMethod === "bank_transfer"}
                onChange={() => setPaymentMethod("bank_transfer")}
                disabled={busy}
              />
              <span>Chuyển khoản trực tiếp</span>
            </label>
          </fieldset>
          {paymentMethod === "bank_transfer" && <BankTransfer amount={total} />}
          <label>
            Ghi chú <span className="optional">(không bắt buộc)</span>
            <textarea
              name="note"
              rows={3}
              maxLength={1000}
              placeholder="Ví dụ: tách riêng áo trắng, gọi trước khi đến…"
              disabled={busy}
            />
          </label>
        </section>
      </div>
      <aside className="order-summary">
        <div className="summary-header">
          <ServiceEmoji id={1} />
          <h2>Giỏ đồ của bạn</h2>
        </div>
        {chosen.length ? (
          <ul className="summary-items">
            {chosen.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <span>
                    {quantities[s.id]} {UNIT_LABEL[s.unit]} ×{" "}
                    {formatVND(s.price)}
                  </span>
                </div>
                <div className="summary-item-end">
                  <strong>
                    {formatVND(Math.round(quantities[s.id] * s.price))}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setQuantity(s.id, "0")}
                    aria-label={`Bỏ ${s.name}`}
                    disabled={busy}
                  >
                    Bỏ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-basket">
            <p>Giỏ đồ đang chờ bạn.</p>
            <span>
              Chọn dịch vụ và nhập số lượng ở bên cạnh để xem tạm tính.
            </span>
          </div>
        )}
        <div className="summary-total">
          <span>Tạm tính</span>
          <strong aria-live="polite">{formatVND(total)}</strong>
        </div>
        <p className="field-help">
          Chi phí được xác nhận lại theo khối lượng thực tế trước khi xử lý.
        </p>
        <div className="consent-fields">
          <p><strong>Chỉ dùng dữ liệu giả.</strong> Đơn, báo giá và thanh toán trong bản portfolio đều mô phỏng.</p>
          <label><input type="checkbox" name="consent" required disabled={busy} /> Tôi đồng ý báo giá v0, chính sách portfolio-v1.2 và dữ liệu demo.</label>
          <label><input type="checkbox" name="tolerance_consent" checked={toleranceConsent} onChange={e => setToleranceConsent(e.target.checked)} disabled={busy} /> Cho phép cân thực tế trong ±10% hoặc ±0,30 kg, lấy mức lớn hơn cho từng dòng kg gốc.</label>
          <p aria-live="polite">Mức tối đa được đồng ý: <strong>{formatVND(maximum)}</strong>. Không chọn dung sai: mọi thay đổi cân nặng cần báo giá mới.</p>
        </div>
        {error && (
          <div className="form-error" role="alert" ref={errorRef} tabIndex={-1}>
            {error}
          </div>
        )}
        <button
          className="button full-button"
          type="submit"
          disabled={busy || demo}
        >
          {busy
            ? "Đang gửi lịch hẹn…"
            : demo
              ? "Chưa mở nhận lịch"
              : "Xác nhận đặt lịch"}
          {!busy && <Arrow />}
        </button>
        <p className="summary-note">
          Không thu tiền trực tuyến.
          <br />
          Lưu mã đơn sau khi đặt để tra cứu.
        </p>
      </aside>
    </form>
  );
}

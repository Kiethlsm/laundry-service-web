"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { formatVND } from "@/lib/format";

// Public receiving details supplied by the user with the QR image.
const account = "38606688";
const recipient = "CONG TY TNHH THUONG MAI DICH VU VAN TAI AN LINH";
const qr = "/payments/techcombank-qr.png";

export function BankTransfer({ amount, orderCode }: { amount: number; orderCode?: string }) {
  const heading = useId();
  const [feedback, setFeedback] = useState("");
  const memo = orderCode && /^LD\d+$/.test(orderCode) ? `SACHSACH ${orderCode}` : null;

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`Đã sao chép ${label}.`);
    } catch {
      setFeedback("Chưa sao chép được. Bạn có thể chọn và sao chép dòng thông tin bên trên.");
    }
  }

  return (
    <section className="bank-transfer" aria-labelledby={heading}>
      <header className="bank-transfer-heading">
        <h3 id={heading}>Chuyển khoản Techcombank</h3>
        <span>Đối soát thủ công</span>
      </header>
      <p className="bank-transfer-demo">Bản portfolio đang mô phỏng — không chuyển tiền thật.</p>
      <div className="bank-transfer-layout">
        <div className="bank-transfer-image">
          <div className="bank-transfer-qr-frame">
            <Image src={qr} alt="QR Techcombank của tài khoản nhận 38606688" width={1228} height={1281} unoptimized />
          </div>
          <a className="text-link" href={qr} download="QR-Techcombank.png">Tải ảnh QR</a>
        </div>
        <div className="bank-transfer-info">
          <dl>
            <div><dt>Người nhận theo QR</dt><dd className="bank-transfer-recipient">{recipient}</dd></div>
            <div><dt>Số tài khoản</dt><dd className="bank-transfer-account">{account}</dd></div>
          </dl>
          <button className="bank-transfer-copy" type="button" data-copy="account" onClick={() => copy(account, "số tài khoản")}>Sao chép số tài khoản</button>
          <dl>
            <div><dt>Tạm tính theo đơn</dt><dd className="bank-transfer-amount">{formatVND(amount)}</dd></div>
            {memo && <div><dt>Nội dung chuyển khoản</dt><dd className="bank-transfer-memo">{memo}</dd></div>}
          </dl>
          {memo ? <button className="bank-transfer-copy" type="button" data-copy="memo" onClick={() => copy(memo, "nội dung chuyển khoản")}>Sao chép nội dung</button> : <p className="field-help">Nội dung theo mã đơn sẽ xuất hiện sau khi đặt lịch thành công.</p>}
          <p className="bank-transfer-feedback" role="status" aria-live="polite">{feedback}</p>
        </div>
      </div>
      <p className="bank-transfer-note">QR tĩnh dùng chung cho các đơn. Chỉ chuyển sau khi cửa hàng chốt chi phí; nhập hoặc kiểm tra đúng số tiền và nội dung được xác nhận, rồi kiểm tra người nhận trong ứng dụng ngân hàng.</p>
      <p className="bank-transfer-note">Cửa hàng kiểm tra giao dịch thực nhận trước khi ghi sổ. Quét QR hoặc gửi biên lai không tự xác nhận đã thanh toán.</p>
    </section>
  );
}

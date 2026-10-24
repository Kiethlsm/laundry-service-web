"use client";
import { useId, useState, type ReactNode } from "react";
import type { NextAction, WorkPanel } from "@/lib/admin-operations";
const panelsList: { id: WorkPanel; label: string }[] = [
  { id: "bags", label: "Nhận & xử lý đồ" },
  { id: "quotes", label: "Cân & báo giá" },
  { id: "payments", label: "Thu tiền & trả đồ" },
  { id: "issues", label: "Sự cố & ghi chú" },
];
export function WorkflowPanels({ next, panels }: { next: NextAction; panels: Record<WorkPanel, ReactNode> }) {
  const [active, setActive] = useState<WorkPanel>(next.panel);
  const id = useId();
  return <div className="operation-workspace">
    <div className="admin-next-step">
      <div><h2>{next.title}</h2><p>{next.help}</p></div>
      <button className="button" type="button" onClick={() => setActive(next.panel)}>Mở bước tiếp theo <span aria-hidden="true">→</span></button>
    </div>
    <div className="workspace-switcher" role="group" aria-label="Chọn công việc trong đơn">
      {panelsList.map(p => <button key={p.id} type="button" aria-pressed={active === p.id} aria-controls={`${id}-${p.id}`} onClick={() => setActive(p.id)}>{p.label}</button>)}
    </div>
    {panelsList.map(p => <div id={`${id}-${p.id}`} key={p.id} hidden={active !== p.id} className="workspace-panel" aria-label={p.label}>{panels[p.id]}</div>)}
    <p className="admin-integrity-note">Các thao tác sổ tiền và bằng chứng hiện vẫn là mô phỏng. Ghi chú điện thoại không thay thế xác nhận của khách; quét QR không tự xác nhận thanh toán.</p>
  </div>;
}

"use client";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { NextAction, WorkPanel } from "@/lib/admin-operations";
import { STATUS_LABEL, STATUS_FLOW, type OrderStatus } from "@/lib/format";
import { actionGuidance } from "@/lib/action-guidance";
const FeedbackContext = createContext<{status:string; busy:boolean; begin:()=>void; fail:()=>void; notify:(action:string,tag:string,revision:number)=>void} | null>(null);
export const useOperationFeedback = () => useContext(FeedbackContext);
const panelsList: { id: WorkPanel; label: string }[] = [
  { id: "bags", label: "Nhận & xử lý đồ" },
  { id: "quotes", label: "Cân & báo giá" },
  { id: "payments", label: "Thu tiền & trả đồ" },
  { id: "issues", label: "Sự cố & ghi chú" },
];
export function WorkflowPanels({ next, panels, orderStatus, orderRevision, orderCode }: { next: NextAction; panels: Record<WorkPanel, ReactNode>; orderStatus:string; orderRevision:number; orderCode?:string }) {
  const [active, setActive] = useState<WorkPanel>(next.panel);
  const id = useId();
  const [feedback,setFeedback]=useState<{text:string;tag:string;revision:number}|null>(null);
  const [inFlight,setInFlight]=useState(false);
  const synchronized=!!feedback&&orderRevision>=feedback.revision;
  const busy=inFlight||!!feedback&&!synchronized;
  const feedbackRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(synchronized)feedbackRef.current?.focus();},[feedback,synchronized]);
  const notify=(action:string,tag:string,revision:number)=>{setFeedback({text:actionGuidance(action,orderStatus).success,tag,revision});setInFlight(false);};
  const openNext=()=>{setActive(next.panel);requestAnimationFrame(()=>{const panel=document.getElementById(`${id}-${next.panel}`);const node=panel?.querySelector<HTMLElement>('[data-primary-operation]')??panel;node?.scrollIntoView({block:"start"});node?.focus({preventScroll:true});});};
  const current=STATUS_FLOW.indexOf(orderStatus as OrderStatus);
  return <FeedbackContext.Provider value={{status:orderStatus,busy,begin:()=>{setFeedback(null);setInFlight(true);},fail:()=>setInFlight(false),notify}}><div className="operation-workspace">
    {busy&&<div role="status" className="operation-saving"><p>Đang cập nhật đơn và tiến độ trên màn hình. Vui lòng chờ trước khi làm bước tiếp theo…</p>{!inFlight&&<button type="button" className="text-link" onClick={()=>window.location.reload()}>Tải lại trạng thái đơn</button>}</div>}
    {feedback&&synchronized&&<div ref={feedbackRef} tabIndex={-1} role="status" className="operation-feedback"><strong>{feedback.text}</strong>{feedback.tag&&<span>Bọc: {feedback.tag}</span>}<span>Trạng thái đơn: {STATUS_LABEL[orderStatus as OrderStatus]??"Xem tiến độ bên dưới"}.</span><p>Xem hướng dẫn bên dưới để làm tiếp; không cần bấm lưu lại.</p></div>}
    <section className="order-stage-strip" aria-label="Tiến độ của đơn"><div><strong>Bạn đang cập nhật {orderCode??"đơn đang mở"}</strong><span className="order-stage-current">{STATUS_LABEL[orderStatus as OrderStatus]??"Cần kiểm tra trạng thái"}</span></div><ol>{STATUS_FLOW.map((state,index)=><li key={state} aria-current={state===orderStatus?"step":undefined} data-complete={current>index}><span aria-hidden="true">{index+1}</span>{STATUS_LABEL[state]}</li>)}</ol><p>Tiến độ áp dụng cho cả đơn; từng bọc có mã và tình trạng giữ / trả bên dưới.</p></section>
    <div className="admin-next-step">
      <div><h2>{next.title}</h2><p>{next.help}</p></div>
      <button className="button" type="button" onClick={openNext}>Mở bước tiếp theo <span aria-hidden="true">→</span></button>
    </div>
    <div className="workspace-switcher" role="group" aria-label="Chọn công việc trong đơn">
      {panelsList.map(p => <button key={p.id} type="button" aria-pressed={active === p.id} aria-controls={`${id}-${p.id}`} onClick={() => setActive(p.id)}>{p.label}</button>)}
    </div>
    {panelsList.map(p => <div id={`${id}-${p.id}`} key={p.id} hidden={active !== p.id} role="region" tabIndex={-1} className="workspace-panel" aria-label={p.label}>{panels[p.id]}</div>)}
    {active!=="bags"&&<p className="admin-integrity-note">Các thao tác sổ tiền và bằng chứng hiện vẫn là mô phỏng. Ghi chú điện thoại không thay thế xác nhận của khách; quét QR không tự xác nhận thanh toán.</p>}
  </div></FeedbackContext.Provider>;
}

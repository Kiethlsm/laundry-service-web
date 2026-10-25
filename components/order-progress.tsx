import { STATUS_FLOW,STATUS_LABEL,type OrderStatus } from "@/lib/format";
export const customerNext:Record<OrderStatus,string>={pending:"Tiệm sẽ liên hệ để xác nhận lịch nhận đồ và chi phí.",picked_up:"Tiệm đã nhận đồ và đang xác nhận số lượng trước khi xử lý.",processing:"Đồ đang được giặt và chăm sóc theo dịch vụ đã chọn.",ready:"Đồ đã sẵn sàng. Bạn có thể gọi tiệm để xác nhận giờ nhận hoặc giao lại.",delivered:"Đơn đã hoàn tất. Cảm ơn bạn đã gửi đồ tại Sạch Sạch.",cancelled:"Đơn đã hủy. Nếu tiệm còn giữ đồ hoặc cần đối chiếu tiền, bạn hãy gọi tiệm."};
export function OrderProgress({status}:{status:OrderStatus}){
  const index=STATUS_FLOW.indexOf(status);
  return <section className="customer-progress" aria-label="Tiến độ đơn hàng">
    {status==='cancelled'?<strong>Đơn đã hủy</strong>:<ol>{STATUS_FLOW.map((state,i)=><li key={state} aria-current={state===status?'step':undefined} data-complete={i<index}><span aria-hidden="true">{i+1}</span>{STATUS_LABEL[state]}</li>)}</ol>}
    <p>{customerNext[status]}</p>
  </section>;
}

import Link from "next/link";
import {notFound} from "next/navigation";
import {requireCustomer} from "@/lib/customer";
import {loadCustomerOrder} from "@/lib/customer-order";
import {formatDate,formatVND,UNIT_LABEL} from "@/lib/format";
import {SHOP} from "@/lib/shop";
import {StatusBadge} from "@/components/ui";
import {OrderProgress} from "@/components/order-progress";
export const dynamic="force-dynamic";
export const metadata={title:"Đơn của bạn",robots:{index:false,follow:false}};
export default async function CustomerOrderDetail({params}:{params:Promise<{id:string}>}){
  const {auth,user}=await requireCustomer();const {id}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))notFound();
  const order=await loadCustomerOrder(auth,user.id,id);if(!order)notFound();
  return <div className="container page-space customer-order-page" data-customer-order-detail>
    <Link href="/tai-khoan" className="text-link">← Về đơn của bạn</Link>
    <header className="customer-order-heading"><div><h1>{order.code}</h1><p>Đặt lúc {formatDate(order.created_at)}</p></div><StatusBadge status={order.status}/></header>
    <OrderProgress status={order.status}/>
    <section className="customer-current-price"><span>Thành tiền hiện tại</span><strong>{formatVND(order.total)}</strong><p>Tiệm xác nhận khối lượng và chi phí trước khi xử lý. Số tiền này chưa xác nhận bạn đã thanh toán.</p>{order.estimate!==null&&order.estimate!==order.total&&<p>Dự kiến theo báo giá: {formatVND(order.estimate)}</p>}</section>
    <section className="customer-service-list"><h2>Đồ trong đơn</h2><p>{order.hasMeasurement?'Số lượng theo lần chốt gần nhất của tiệm.':'Số lượng dự kiến khi đặt lịch.'}</p>{order.items.length?<ul>{order.items.map((item,i)=><li key={i}><div><strong>{item.name}</strong><span data-actual-quantity>{new Intl.NumberFormat('vi-VN').format(item.quantity)} {UNIT_LABEL[item.unit]}</span></div><span>{formatVND(item.rate)} / {UNIT_LABEL[item.unit]}</span></li>)}</ul>:<p>Đơn cũ chưa có chi tiết theo quy trình hiện tại. Bạn có thể gọi tiệm để hỏi thêm.</p>}</section>
    <div className="customer-order-contact"><p>Cần thay đổi lịch hoặc hỏi về đơn này?</p><a className="button" href={`tel:${SHOP.phone}`}>Gọi tiệm · {SHOP.phone}</a><Link className="text-link" href="/dat-lich">Đặt lịch mới</Link></div>
  </div>;
}

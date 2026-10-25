import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { formatVND, UNIT_LABEL } from "@/lib/format";
import { ServiceDial } from "@/components/service-dial";
import { Arrow, ServiceEmoji } from "@/components/ui";
import { ScrollScene } from "@/components/scroll-scene";
import { SHOP } from "@/lib/shop";
export const dynamic = "force-dynamic";
export default async function Home() {
 const { categories, services } = await getCatalog();
 return <div className="home-page home-refresh">
  <ScrollScene><section className="hero container">
   <div className="hero-copy">
    <h1>Việc giặt giũ,<br/><span>để tiệm lo.</span></h1>
    <p>Quần áo hằng ngày, đôi giày yêu thích hay chiếc chăn ở nhà. Chọn dịch vụ, hẹn giờ lấy đồ; Sạch Sạch xác nhận chi phí trước khi xử lý.</p>
    <div className="actions"><Link className="button" href="/dat-lich">Đặt lịch lấy đồ <Arrow/></Link><Link className="text-link" href="/tra-cuu">Tra cứu đơn đã đặt <Arrow/></Link></div>
    <p className="landing-guest-note">Bạn có thể đặt lịch mà không cần tạo tài khoản.</p>
    <a className="landing-service-jump text-link" href="#dich-vu">Xem dịch vụ & giá tham khảo <Arrow/></a>
   </div>
   <div className="landing-machine"><ServiceDial categories={categories} services={services}/><p>Chọn dịch vụ trên máy để xem giá khởi điểm.</p></div>
  </section></ScrollScene>
  <div className="landing-contact container"><a href={"tel:"+SHOP.phone}><span>Cần hỏi tiệm trước khi đặt?</span><strong>{SHOP.phone} <Arrow/></strong></a><a href={SHOP.mapsUrl} target="_blank" rel="noopener noreferrer"><span>Ghé Sạch Sạch</span><strong>{SHOP.address} <Arrow/></strong></a></div>
  <section className="service-section container" id="dich-vu">
   <div className="landing-section-heading"><div><h2>Đồ gì cần chăm,<br/>Sạch Sạch có dịch vụ đó.</h2><p>Sáu nhóm dịch vụ. Giá dưới đây là mức khởi điểm; chi phí được chốt theo đồ thực tế và sự đồng ý của bạn.</p></div><Link className="text-link" href="/bang-gia">Xem toàn bộ bảng giá <Arrow/></Link></div>
   <div className="landing-services">{categories.map(c=>{
    const lowest=services.filter(s=>s.category_id===c.id).reduce((best,s)=>!best||s.price<best.price?s:best,undefined as (typeof services)[number]|undefined);
    return <Link key={c.id} className="service-line" href={"/bang-gia#"+c.slug}><ServiceEmoji id={c.id}/><div className="service-line-description"><h3>{c.name}</h3><p>{c.description}</p></div><div className="service-line-price">{lowest?<><span>Từ</span><strong>{formatVND(lowest.price)}</strong><span>/ {UNIT_LABEL[lowest.unit]}</span></>:<span>Liên hệ tiệm</span>}</div><Arrow/></Link>;
   })}</div>
  </section>
  <section className="landing-process"><div className="container landing-process-inner">
   <div><h2>Một lịch hẹn.<br/>Rõ từng bước.</h2><p>Bạn biết đồ đang ở bước nào và chi phí được xác nhận trước khi tiệm bắt đầu xử lý.</p><Link className="text-link" href="/tra-cuu">Theo dõi đơn của bạn <Arrow/></Link></div>
   <ol>{[
    ["Chọn dịch vụ & hẹn giờ","Nhập số lượng dự kiến và địa chỉ lấy đồ. Lưu lại mã đơn để tra cứu."],
    ["Nhận đồ & chốt báo giá","Tiệm nhận bọc đồ, kiểm số lượng và xác nhận chi phí với bạn."],
    ["Giặt, sấy & chăm đồ","Xử lý theo dịch vụ và báo giá đã được bạn đồng ý."],
    ["Trả đồ & đối chiếu tiền","Nhận lại đồ, kiểm đủ bọc và thanh toán tiền mặt hoặc chuyển khoản theo hướng dẫn của tiệm."],
   ].map(([title,help],i)=><li key={title}><span aria-hidden="true">{i+1}</span><div><h3>{title}</h3><p>{help}</p></div></li>)}</ol>
  </div></section>
  <section className="container landing-closing"><div><h2>Giỏ đồ đầy rồi?<br/>Mình hẹn nhau nhé.</h2><p>Chọn dịch vụ và gửi lịch lấy đồ trong cùng một trang.</p></div><div><Link className="button" href="/dat-lich">Đặt lịch ngay <Arrow/></Link><a className="text-link" href={"tel:"+SHOP.phone}>Gọi tiệm: {SHOP.phone}</a></div></section>
 </div>;
}

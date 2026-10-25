import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { formatVND, UNIT_LABEL } from "@/lib/format";
import { SHOP } from "@/lib/shop";
import { Arrow, ServiceEmoji, PreviewNotice } from "@/components/ui";
import "./pricing.css";

export const metadata: Metadata = { title: "Bảng giá dịch vụ" };
export const dynamic = "force-dynamic";

export default async function Pricing() {
  const { categories, services, demo } = await getCatalog();
  return (
    <div className="container pricing-page">
      <header className="pricing-intro">
        <div>
          <h1>Bảng giá dịch vụ</h1>
          <p>Đồ cần chăm, giá dễ xem.<br />Chọn dịch vụ để xem đơn giá cho từng kg, đôi hoặc món.</p>
        </div>
        <div className="pricing-price-rule">
          <strong>Đơn giá × số lượng thực tế</strong>
          <p>Tiệm xác nhận khối lượng và chi phí với bạn trước khi xử lý.</p>
        </div>
      </header>
      {demo && <PreviewNotice />}
      <div className="pricing-layout">
        <aside className="pricing-sidebar">
          <nav data-price-navigation aria-label="Xem nhóm dịch vụ">
            <h2>Bạn cần giặt gì?</h2>
            <div className="pricing-shortcuts">
              {categories.map(c => <a href={`#${c.slug}`} key={c.id}>{c.name}<Arrow /></a>)}
            </div>
          </nav>
          <div className="pricing-help">
            <p>Chưa rõ đồ của bạn thuộc loại nào?</p>
            <a href={`tel:${SHOP.phone}`}>Gọi tiệm: {SHOP.phone}<Arrow /></a>
          </div>
        </aside>
        <div className="pricing-sheet">
          <p id="pricing-notes" className="pricing-notes">Thời gian xử lý là dự kiến, chưa gồm thời gian lấy và giao.</p>
          {categories.map(c => {
            const items = services.filter(s => s.category_id === c.id);
            return <section className="pricing-category" id={c.slug} key={c.id} aria-labelledby={`price-heading-${c.id}`}>
              <header className="pricing-group-heading">
                <div><ServiceEmoji id={c.id} /><h2 id={`price-heading-${c.id}`}>{c.name}</h2></div>
                {items.length > 0 && <Link data-booking href={`/dat-lich?nhom=${c.slug}`} className="pricing-book-link">Đặt {c.name.toLocaleLowerCase("vi-VN")}<Arrow /></Link>}
              </header>
              {items.length > 0 ? <table className="pricing-table" data-price-table aria-describedby="pricing-notes">
                <caption className="pricing-sr-only">Đơn giá {c.name.toLocaleLowerCase("vi-VN")}</caption>
                <thead><tr><th scope="col">Dịch vụ</th><th scope="col" className="pricing-time-cell">Xử lý dự kiến</th><th scope="col" className="pricing-price-cell">Đơn giá</th></tr></thead>
                <tbody>{items.map(s => <tr key={s.id} data-service-id={s.id}>
                  <th scope="row"><span data-service-name>{s.name}</span><span className="pricing-mobile-time">Dự kiến {s.est_hours} giờ</span></th>
                  <td className="pricing-time-cell"><span data-hours>{s.est_hours} giờ</span></td>
                  <td className="pricing-price-cell"><strong data-price>{formatVND(s.price)}</strong><span data-unit className="pricing-unit">/ {UNIT_LABEL[s.unit]}</span></td>
                </tr>)}</tbody>
              </table> : <p className="pricing-empty">Giá đang cập nhật. <a href={`tel:${SHOP.phone}`}>Gọi tiệm để hỏi giá</a>.</p>}
            </section>;
          })}
          {categories.length === 0 && <p className="pricing-empty">Giá đang cập nhật. <a href={`tel:${SHOP.phone}`}>Gọi tiệm để hỏi giá</a>.</p>}
          <div className="pricing-closing">
            <div><h2>Đã chọn được dịch vụ?</h2><p>Chọn số lượng dự kiến khi đặt lịch. Tiệm sẽ xác nhận lại khi nhận đồ.</p></div>
            <Link className="button" href="/dat-lich">Đặt lịch lấy đồ<Arrow /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

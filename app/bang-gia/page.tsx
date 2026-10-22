import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { formatVND, UNIT_LABEL } from "@/lib/format";
import { Arrow, ServiceEmoji, PreviewNotice } from "@/components/ui";
export const metadata: Metadata = { title: "Bảng giá dịch vụ" };
export const dynamic = "force-dynamic";
export default async function Pricing() {
  const { categories, services, demo } = await getCatalog();
  return (
    <div className="container page-space">
      <div className="page-heading">
        <h1>Sạch sẽ, rõ giá.</h1>
        <p>
          Chọn cách chăm đồ phù hợp. Giá tính theo số lượng thực tế,
          <br className="desktop-break" /> thời gian xử lý là dự kiến, chưa gồm
          thời gian lấy và giao.
        </p>
      </div>
      {demo && <PreviewNotice />}
      <nav className="category-nav" aria-label="Nhóm dịch vụ">
        {categories.map((c) => (
          <a key={c.id} href={`#${c.slug}`}>
            {c.name}
          </a>
        ))}
      </nav>
      <div className="pricing-grid">
        {categories.map((c) => (
          <section className="pricing-group" id={c.slug} key={c.id}>
            <div className="pricing-title">
              <ServiceEmoji id={c.id} />
              <div>
                <h2>{c.name}</h2>
                <p>{c.description}</p>
              </div>
            </div>
            <div>
              {services
                .filter((s) => s.category_id === c.id)
                .map((s) => (
                  <div className="price-row" key={s.id}>
                    <div>
                      <h3>{s.name}</h3>
                      <span>Dự kiến {s.est_hours} giờ</span>
                    </div>
                    <p>
                      <strong>{formatVND(s.price)}</strong>
                      <span> / {UNIT_LABEL[s.unit]}</span>
                    </p>
                  </div>
                ))}
            </div>
            <Link href={`/dat-lich?nhom=${c.slug}`} className="text-link">
              Đặt lịch {c.name.toLocaleLowerCase("vi-VN")} <Arrow />
            </Link>
          </section>
        ))}
      </div>
      <div className="note-strip">
        <p>
          <strong>Một lưu ý nhỏ</strong>
          <br />
          Số kg khi đặt là ước lượng. Cửa hàng sẽ xác nhận khối lượng và chi phí
          thực tế trước khi xử lý.
        </p>
        <Link className="button" href="/dat-lich">
          Đặt lịch ngay <Arrow />
        </Link>
      </div>
    </div>
  );
}

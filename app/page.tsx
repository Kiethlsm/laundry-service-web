import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { formatVND, UNIT_LABEL } from "@/lib/format";
import { ServiceDial } from "@/components/service-dial";
import { Arrow, Check, ServiceEmoji } from "@/components/ui";
import { ScrollScene } from "@/components/scroll-scene";

export const dynamic = "force-dynamic";
export default async function Home() {
  const { categories, services } = await getCatalog();
  return (
    <div className="home-page">
      <ScrollScene>
        <section className="hero container">
          <div className="hero-copy">
            <h1>
              Việc giặt giũ,
              <br />
              để <span>Sạch Sạch</span> lo.
            </h1>
            <p>
              Quần áo, đôi giày hay chiếc chăn yêu thích.
              <br className="desktop-break" /> Bạn đặt lịch, chúng mình đến lấy
              và giao lại gọn gàng.
            </p>
            <div className="actions">
              <Link className="button" href="/dat-lich">
                Đặt lịch ngay <Arrow />
              </Link>
              <Link className="text-link" href="/bang-gia">
                Xem bảng giá <Arrow />
              </Link>
            </div>
            <div className="hero-note">
              <span className="tiny-check">
                <Check />
              </span>{" "}
              Không cần tài khoản <span className="dot" /> Biết giá trước khi
              đặt
            </div>
            <a className="scroll-invitation" href="#dich-vu">
              <span className="scroll-icon" aria-hidden="true">
                <Arrow />
              </span>
              Cuộn xuống, nhẹ việc nhà
            </a>
          </div>
          <ServiceDial categories={categories} services={services} />
        </section>
      </ScrollScene>
      <section className="service-section container" id="dich-vu">
        <div className="section-heading">
          <div>
            <h2>
              Từ đồ hằng ngày
              <br />
              đến món đồ bạn thương.
            </h2>
            <p>Sáu dịch vụ, một chỗ gửi gắm.</p>
          </div>
          <Link href="/bang-gia" className="text-link">
            Bảng giá chi tiết <Arrow />
          </Link>
        </div>
        <div className="service-grid">
          {categories.map((c) => {
            const group = services.filter((s) => s.category_id === c.id);
            const min = group.reduce(
              (a, s) => (!a || s.price < a.price ? s : a),
              undefined as (typeof group)[number] | undefined,
            );
            return (
              <Link
                className="service-card"
                href={`/bang-gia#${c.slug}`}
                key={c.id}
              >
                <div className="service-top">
                  <ServiceEmoji id={c.id} />
                  <Arrow />
                </div>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="service-price">
                  {min ? (
                    <>
                      Từ <strong>{formatVND(min.price)}</strong> /{" "}
                      {UNIT_LABEL[min.unit]}
                    </>
                  ) : (
                    "Liên hệ cửa hàng"
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="process-section">
        <div className="container">
          <div className="section-heading">
            <h2>
              Một lịch hẹn.
              <br />
              Nhẹ cả việc nhà.
            </h2>
            <p>
              Bạn dành thời gian cho điều mình thích.
              <br />
              Phần giặt giũ cứ để chúng mình.
            </p>
          </div>
          <ol className="process-grid">
            {[
              ["Đặt lịch", "Chọn dịch vụ và hẹn giờ lấy đồ phù hợp với bạn."],
              ["Lấy đồ", "Cửa hàng liên hệ xác nhận và đến địa chỉ đã hẹn."],
              ["Xử lý", "Giặt, sấy, ủi hoặc sửa theo dịch vụ bạn chọn."],
              ["Giao tận nơi", "Nhận lại đồ sạch và thanh toán khi nhận đồ."],
            ].map(([title, description], i) => (
              <li key={title}>
                <span className="step-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="closing container">
        <div>
          <h2>
            Giỏ đồ đầy rồi?
            <br />
            Mình hẹn nhau nhé.
          </h2>
          <p>Chọn dịch vụ, xem tạm tính và đặt lịch trong cùng một trang.</p>
        </div>
        <Link className="button" href="/dat-lich">
          Đặt lịch lấy đồ <Arrow />
        </Link>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { BookingForm } from "@/components/booking-form";
import { PreviewNotice } from "@/components/ui";
export const metadata: Metadata = { title: "Đặt lịch lấy đồ" };
export const dynamic = "force-dynamic";
export default async function Booking({
  searchParams,
}: {
  searchParams: Promise<{ nhom?: string }>;
}) {
  const { categories, services, demo } = await getCatalog();
  const { nhom } = await searchParams;
  return (
    <div className="container page-space">
      <div className="page-heading">
        <h1>Hẹn một ngày đồ sạch.</h1>
        <p>
          Chọn dịch vụ và cho chúng mình biết nơi lấy đồ.
          <br className="desktop-break" /> Không cần tạo tài khoản, chỉ cần một
          lịch hẹn.
        </p>
      </div>
      {demo && <PreviewNotice />}
      <BookingForm
        categories={categories}
        services={services}
        demo={demo}
        initialCategory={nhom}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { TrackForm } from "@/components/track-form";
import { isConfigured } from "@/lib/supabase-server";
import { PreviewNotice } from "@/components/ui";
export const metadata: Metadata = { title: "Tra cứu đơn hàng" };
export const dynamic = "force-dynamic";
export default async function Track({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string }>;
}) {
  const { ma } = await searchParams;
  const demo = !isConfigured();
  return (
    <div className="container page-space">
      <div className="page-heading">
        <h1>Đồ của bạn đến đâu rồi?</h1>
        <p>
          Nhập mã đơn và số điện thoại đã đặt lịch.
          <br className="desktop-break" /> Chúng mình sẽ cho bạn biết tiến độ
          mới nhất.
        </p>
      </div>
      {demo && <PreviewNotice />}
      <TrackForm initialCode={ma || ""} demo={demo} />
    </div>
  );
}

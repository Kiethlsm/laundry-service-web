import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { STATUS_LABEL, type OrderStatus } from "@/lib/format";
import { AdminOrders, type OrderSummary } from "@/components/admin-orders";
import { logout } from "./actions";
import { authClient } from "@/lib/supabase-server";
import { DemoFinancialReport, type DemoReport } from "@/components/demo-financial-report";
export const metadata: Metadata = { title: "Quản lý tiệm", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { db } = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 24) : "";
  const status = params.status && Object.hasOwn(STATUS_LABEL, params.status) ? params.status as OrderStatus : "";
  let query = db.from("orders").select("id,code,customer_name,customer_phone,total,status,created_at,pickup_time,pickup_address").order("created_at", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  const validSearch = /^[a-zA-Z0-9]+$/.test(q);
  if (q && validSearch) query = query.or("code.ilike.%" + q + "%,customer_phone.ilike.%" + q + "%");
  const { data, error } = await query;
  if (error) throw new Error("Không tải được danh sách đơn. Hãy tải lại trang.");
  const orders = (q && !validSearch ? [] : data ?? []) as OrderSummary[];
  const auth = await authClient();
  const report = await auth.rpc("demo_financial_report");
  return <div className="container page-space admin-page">
    <div className="admin-heading"><div><h1>Quản lý tiệm</h1><p>Xem đơn, làm từng việc, giao đồ đúng hẹn.</p></div><form action={logout}><button className="text-button">Đăng xuất ↗</button></form></div>
    <form className="admin-search" method="get" aria-label="Tìm đơn hàng">
      <label htmlFor="admin-search">Tìm mã đơn hoặc số điện thoại</label>
      <div><input id="admin-search" name="q" defaultValue={q} maxLength={24} placeholder="VD: LD1001 hoặc 090…" /><button className="button">Tìm đơn</button>{(q || status) && <Link className="text-link" href="/admin">Xóa bộ lọc</Link>}</div>
    </form>
    {status && <p className="admin-filter-note">Đang lọc: {STATUS_LABEL[status]}. <Link href="/admin">Bỏ lọc trạng thái</Link></p>}
    <AdminOrders key={q + ":" + status} orders={orders} q={q} />
    <details className="admin-report"><summary>Thu chi & giá trị đơn <span>Xem khi cần đối chiếu</span></summary>{report.error || !report.data ? <p role="status">Chưa tải được báo cáo. Bạn vẫn có thể xem và xử lý các đơn phía trên.</p> : <DemoFinancialReport report={report.data as DemoReport} />}</details>
  </div>;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { OrderDetail } from "@/components/order-detail";
import { DemoWorkspace } from "@/components/demo-workspace";
import { authClient } from "@/lib/supabase-server";
import type { DemoWorkspaceData } from "@/lib/demo-types";
import type { Order } from "@/lib/types";
import { StatusBadge } from "@/components/ui";
import { readSettlementItems } from "@/lib/settlement-view";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Chi tiết đơn hàng",
  robots: { index: false, follow: false },
};
export default async function AdminOrder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { db } = await requireAdmin();
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  const { data, error } = await db
    .from("orders")
    .select(
      "*,order_items(quantity,unit_price,services(name,unit)),order_status_history(id,status,changed_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Không tải được đơn hàng.");
  if (!data) notFound();
  const order = data as unknown as Order;
  let workspace: DemoWorkspaceData | null = null;
  if (data.is_synthetic) {
    const auth = await authClient();
    const result = await auth.rpc("demo_order_detail", {p_order:id});
    if (result.error || !result.data?.order) throw new Error("Chưa tải được quy trình xử lý. Hãy thử lại.");
    workspace = result.data as DemoWorkspaceData;
    const payment = await auth.rpc("demo_payment_summary",{p_order:id});
    if(payment.error || !payment.data) throw new Error("Chưa tải được sổ tiền.");
    workspace.money = payment.data;
    workspace.currentItems = await readSettlementItems(auth,id,workspace.order.active_settlement_id,workspace.quotes.find(q=>q.id===workspace?.order.active_quote_id)?.items.map(i=>i.order_item_id));
  }
  return (
    <div className="container page-space admin-page admin-order-page">
      <Link className="text-link back-link" href="/admin">
        ← Về danh sách đơn
      </Link>
      <div className="admin-order-overview">
        <div><h1>{order.code}</h1><p>{order.customer_name}</p><StatusBadge status={order.status} /></div>
        <div><a className="button" href={`tel:${order.customer_phone}`}>Gọi khách · {order.customer_phone}</a><p>{order.pickup_address}</p></div>
      </div>
      {workspace ? <DemoWorkspace data={workspace} orderCode={order.code}/> : <p className="demo-notice">Đơn cũ chỉ đọc và cần xem xét lại; chưa có bằng chứng đồng ý hoặc thanh toán theo quy trình xử lý.</p>}
      <details className="admin-reference"><summary>Thông tin khách, dịch vụ, QR chuyển khoản & lịch sử</summary><OrderDetail order={order} /></details>
    </div>
  );
}

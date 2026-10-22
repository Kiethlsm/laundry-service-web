import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { OrderDetail } from "@/components/order-detail";
import { StatusForm } from "@/components/status-form";
import type { Order } from "@/lib/types";
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
  return (
    <div className="container page-space">
      <Link className="text-link back-link" href="/admin">
        ← Về danh sách đơn
      </Link>
      <OrderDetail order={order} />
      <p className="admin-phone">
        Liên hệ khách:{" "}
        <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
      </p>
      <StatusForm id={order.id} status={order.status} />
    </div>
  );
}

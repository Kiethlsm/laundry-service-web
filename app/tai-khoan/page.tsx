import Link from "next/link";
import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer";
import { CustomerOrders, type CustomerOrder } from "@/components/customer-orders";
import { customerSignOut } from "./actions";
export const metadata: Metadata = { title: "Tài khoản của bạn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function CustomerAccount({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { auth, user } = await requireCustomer();
  const { reason } = await searchParams;
  const { data, error } = await auth.rpc("customer_dashboard");
  if (error || !data || !Array.isArray(data.orders)) throw new Error("Chưa tải được các đơn của bạn. Vui lòng thử lại.");
  return <div className="container page-space customer-account">
    <div className="admin-heading"><div><h1>{data.profile?.full_name ? `Chào ${data.profile.full_name}.` : "Tài khoản của bạn"}</h1><p className="customer-account-email">{user.email}</p></div><form action={customerSignOut}><button className="text-button">Đăng xuất ↗</button></form></div>
    {reason === "logout" && <p className="form-error" role="alert">Chưa đăng xuất được. Vui lòng thử lại.</p>}
    <div className="customer-account-actions"><Link className="button" href="/dat-lich">Đặt lịch mới <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/bang-gia">Xem bảng giá</Link></div>
    <CustomerOrders orders={data.orders as CustomerOrder[]}/>
  </div>;
}

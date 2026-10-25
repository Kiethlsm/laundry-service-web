import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
export type SettlementItem = { order_item_id: number; actual_qty: number; rate: number; line_total: number };
export async function readSettlementItems(auth: SupabaseClient, orderId: string, settlementId: string | null, expectedIds?:number[]): Promise<SettlementItem[]> {
  if (!settlementId) return [];
  const {data,error} = await auth.from("settlement_items").select("order_item_id,actual_qty,rate,line_total").eq("settlement_id",settlementId).eq("order_id",orderId);
  if (error || !Array.isArray(data) || !data.length || data.some(i=>!Number.isSafeInteger(i.order_item_id)||!Number.isFinite(i.actual_qty)||i.actual_qty<=0||!Number.isSafeInteger(i.rate)||i.rate<0||!Number.isSafeInteger(i.line_total)||i.line_total<0))
    throw new Error("Chưa tải được số cân thực tế đã lưu. Hãy tải lại đơn trước khi cập nhật.");
  if(expectedIds&&(data.length!==expectedIds.length||new Set(data.map(i=>i.order_item_id)).size!==expectedIds.length||expectedIds.some(id=>!data.some(i=>i.order_item_id===id))))throw new Error("Chưa tải đủ số cân thực tế của đơn. Hãy tải lại trước khi cập nhật.");
  return data as SettlementItem[];
}

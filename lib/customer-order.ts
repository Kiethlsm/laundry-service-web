import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readSettlementItems } from "@/lib/settlement-view";
import type { DemoWorkspaceData } from "@/lib/demo-types";
import type { OrderStatus } from "@/lib/format";
export async function loadCustomerOrder(auth:SupabaseClient,customerId:string,id:string){
  const {data:row,error}=await auth.from("orders").select("id,code,customer_id,status,total,created_at").eq("id",id).maybeSingle();
  if(error)throw new Error("Chưa tải được đơn của bạn. Hãy thử lại.");
  if(!row||row.customer_id!==customerId)return null;
  const {data,error:detailError}=await auth.rpc("demo_order_detail",{p_order:id});
  if(detailError||!data?.order)throw new Error("Chưa tải được chi tiết đơn. Hãy thử lại.");
  const detail=data as DemoWorkspaceData;
  if(!Number.isSafeInteger(detail.order.total)||detail.order.total<0)throw new Error("Chưa xác nhận được chi phí hiện tại. Hãy tải lại đơn.");
  const quote=detail.quotes.find(q=>q.id===detail.order.active_quote_id);
  const actual=await readSettlementItems(auth,id,detail.order.active_settlement_id,quote?.items.map(i=>i.order_item_id));
  // Explicit public projection: no custody, damage notes, staff identities, hashes or ledger reasons.
  return {id:row.id as string,code:row.code as string,status:detail.order.status as OrderStatus,total:detail.order.total,created_at:row.created_at as string,
    estimate:quote?.base_total??null,hasMeasurement:actual.length>0,
    items:(quote?.items??[]).map(item=>({name:item.snapshot_name,unit:item.snapshot_unit,quantity:actual.find(i=>i.order_item_id===item.order_item_id)?.actual_qty??item.quantity,rate:item.snapshot_rate})),
  };
}

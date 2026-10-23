"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { authClient } from "@/lib/supabase-server";
export type DemoActionState = {error:string;success?:string};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed=new Set(['intake','measure','issue_quote','accept_quote','phone_note','quote_state','start_work','qc','incident','resolve_issue','retag','waive','charge']);
const errorText:Record<string,string>={
 QUOTE_REQUIRED:"Cân nặng, số món hoặc phí đã ngoài phạm vi đồng ý. Hãy phát hành báo giá mới.",
 QUOTE_SUPERSEDED:"Báo giá đã được thay thế. Tải lại và xác nhận đúng phiên bản hiện tại.",
 QUOTE_NOT_APPROVED:"Cần xác nhận báo giá hiện tại trước khi xử lý.",
 REVISION_CONFLICT:"Đơn vừa thay đổi ở nơi khác. Tải lại trang trước khi gửi tiếp.",
 IDEMPOTENCY_CONFLICT:"Nội dung khác với lần gửi trước. Tải lại trang trước khi thao tác mới.",
 BLOCKING_ISSUE:"Cần giải quyết sự cố đang chặn trước khi tiếp tục.",
 EVIDENCE_REQUIRED:"Cần bằng chứng khách gửi được ghi rõ là mô phỏng.",
 RECONCILIATION_MISSING_BAG:"Chưa đối chiếu đủ túi đồ.",RECONCILIATION_MISSING_ITEM:"Chưa đối chiếu đủ món được gắn nhãn riêng.",
 SETTLEMENT_REQUIRED:"Hãy ghi cân thực tế cho báo giá đã được đồng ý.",FORBIDDEN:"Tài khoản không có quyền thực hiện thao tác này.",
};
export async function performDemoAction(_state:DemoActionState,form:FormData):Promise<DemoActionState>{
 await requireAdmin();
 const order=String(form.get('order_id')??''),action=String(form.get('action')??''),key=String(form.get('operation_key')??''),revision=Number(form.get('revision'));
 if(!uuid.test(order)||!uuid.test(key)||!allowed.has(action)||!Number.isSafeInteger(revision)||revision<0)return {error:"Dữ liệu thao tác không hợp lệ. Hãy tải lại trang."};
 const text=(name:string)=>String(form.get(name)??'').trim();
 const items=form.getAll('item_id').map(id=>({order_item_id:Number(id),quantity:Number(form.get('quantity:'+id)),...(form.has('rate:'+id)?{rate:Number(form.get('rate:'+id))}:{})}));
 let data:Record<string,unknown>={};
 switch(action){
  case 'intake':data={bags:form.getAll('bag_index').map(index=>({tag:text('bag_tag:'+index),service_group:text('bag_group:'+index),count:Number(form.get('bag_count:'+index)),condition:text('bag_condition:'+index),flagged:text('flag_description:'+index)?[{tag:text('flag_tag:'+index),description:text('flag_description:'+index),condition:text('flag_condition:'+index)}]:[]}))};break;
  case 'measure':data={items};break;
  case 'issue_quote':data={items,delivery_fee:Number(form.get('delivery_fee')),surcharge:Number(form.get('surcharge')),discount:Number(form.get('discount'))};break;
  case 'accept_quote':data={quote_id:text('quote_id'),hash:text('hash'),amount:Number(form.get('amount')),evidence_source:'customer_message',simulated_customer_message:text('customer_message')};break;
  case 'phone_note':data={message:text('message')};break;
  case 'quote_state':data={state:text('state')};break;
  case 'qc':data={bags:form.getAll('bag_id'),items:form.getAll('flagged_id')};break;
  case 'incident':data={message:text('message'),blocking:form.get('blocking')==='on'};break;
  case 'resolve_issue':data={issue_id:text('issue_id'),reason:text('reason'),simulated_customer_message:text('customer_message')};break;
  case 'retag':case 'waive':data={kind:text('kind'),target_id:text('target_id'),tag:text('tag'),reason:text('reason'),issue_id:text('issue_id')};break;
  case 'charge':data={amount:Number(form.get('amount')),reason:text('reason'),simulated_customer_message:text('customer_message')};break;
 }
 try{
  const auth=await authClient();const {error}=await auth.rpc('order_command',{p_order:order,p_revision:revision,p_key:key,p_action:action,p_data:data});
  if(error)return {error:errorText[error.message]??"Chưa hoàn tất thao tác. Kiểm tra dữ liệu và tải lại đơn trước khi thử lại."};
 }catch{return {error:"Mất kết nối. Giữ nguyên thao tác và thử lại; không đánh dấu hoàn tất khi chưa có xác nhận."};}
 revalidatePath('/admin');revalidatePath('/admin/orders/'+order);
 return {error:'',success:'Đã lưu thao tác demo.'};
}

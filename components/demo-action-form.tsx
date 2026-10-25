"use client";
import {useActionState,useState,type ReactNode} from 'react';
import {performDemoAction} from '@/app/admin/demo-actions';
import {useOperationFeedback} from './workflow-panels';
import {actionGuidance} from '@/lib/action-guidance';
import {STATUS_LABEL,type OrderStatus} from '@/lib/format';
export function DemoActionForm({orderId,revision,action,label,children}:{orderId:string;revision:number;action:string;label:string;children?:ReactNode}){
 return <ActionFields key={revision+':'+action} orderId={orderId} revision={revision} action={action} label={label}>{children}</ActionFields>;
}
function ActionFields({orderId,revision,action,label,children}:{orderId:string;revision:number;action:string;label:string;children?:ReactNode}){
 const [key]=useState(()=>crypto.randomUUID());
 const feedback=useOperationFeedback();
 const guide=actionGuidance(action,feedback?.status??'');
 const [state,submit,pending]=useActionState(async(previous:{error:string;success?:string;revision?:number},form:FormData)=>{
  if(feedback?.busy)return {error:'Đơn đang cập nhật. Vui lòng chờ trước khi lưu tiếp.'};
  feedback?.begin();
  try{
   const result=await performDemoAction(previous,form);
   if(!result.error&&result.success&&result.revision!==undefined)feedback?.notify(action,String(form.get('bag_tag:0')??''),result.revision);
   else feedback?.fail();
   return result;
  }catch(error){feedback?.fail();throw error;}
 },{error:''});
 return <form action={submit} className="demo-action" aria-label={label}>
  <input type="hidden" name="order_id" value={orderId}/><input type="hidden" name="revision" value={revision}/><input type="hidden" name="operation_key" value={key}/><input type="hidden" name="action" value={action}/>
  <fieldset disabled={pending||feedback?.busy}><div className="action-impact"><strong>Sau khi lưu</strong>{feedback&&guide.nextStatus!==feedback.status?<p className="action-status-change">{STATUS_LABEL[feedback.status as OrderStatus]} <span aria-hidden="true">→</span> <b>{STATUS_LABEL[guide.nextStatus as OrderStatus]}</b></p>:<p>Giữ nguyên tiến độ đơn; chỉ ghi nhận thao tác này.</p>}<p>{guide.help}</p>{guide.bagEffect&&<p>{guide.bagEffect}</p>}</div>{children}<button className="button" type="submit">{pending?'Đang cập nhật, vui lòng chờ…':guide.button??label}</button></fieldset>
  {state.error&&<p role="alert" className="form-error">{state.error}</p>}{state.success&&!feedback&&<p role="status">{state.success}</p>}
 </form>;
}

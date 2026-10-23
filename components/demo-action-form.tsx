"use client";
import {useActionState,useState,type ReactNode} from 'react';
import {performDemoAction} from '@/app/admin/demo-actions';
export function DemoActionForm({orderId,revision,action,label,children}:{orderId:string;revision:number;action:string;label:string;children?:ReactNode}){
 return <ActionFields key={revision+':'+action} orderId={orderId} revision={revision} action={action} label={label}>{children}</ActionFields>;
}
function ActionFields({orderId,revision,action,label,children}:{orderId:string;revision:number;action:string;label:string;children?:ReactNode}){
 const [key]=useState(()=>crypto.randomUUID());
 const [state,submit,pending]=useActionState(performDemoAction,{error:''});
 return <form action={submit} className="demo-action" aria-label={label}>
  <input type="hidden" name="order_id" value={orderId}/><input type="hidden" name="revision" value={revision}/><input type="hidden" name="operation_key" value={key}/><input type="hidden" name="action" value={action}/>
  <fieldset disabled={pending}>{children}<button className="button" type="submit">{pending?'Đang lưu…':label}</button></fieldset>
  {state.error&&<p role="alert" className="form-error">{state.error}</p>}{state.success&&<p role="status">{state.success}</p>}
 </form>;
}

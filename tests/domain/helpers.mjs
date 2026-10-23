import {randomUUID} from 'node:crypto';
import {fixture,sql,ids,orders,as,value,concurrentSql} from '../phase01/local-db.mjs';
export {fixture,sql,ids,orders,as,value,concurrentSql,randomUUID};
export const literal=v=>v===null?'NULL':"'"+String(v).replaceAll("'","''")+"'";
export const payload=(extra={})=>({name:'ZZ TEST',phone:'0000000000',address:'Synthetic address',pickup:new Date(Date.now()+86400000).toISOString(),payment:'cash',note:'Synthetic fixture',consent:true,tolerance_consent:true,items:[{service_id:1,quantity:2.5},{service_id:3,quantity:1}],...extra});
export function book(db,body=payload(),key=randomUUID(),owner=null) {
 return JSON.parse(sql(db,`SET ROLE service_role;SELECT book_demo_order(${literal(JSON.stringify(body))}::jsonb,'${key}',${owner?literal(owner)+'::uuid':'NULL'});`));
}
export function command(db,order,action,data={},actor=ids.admin,{revision,key=randomUUID()}={}) {
 const rev=revision??Number(sql(db,`SELECT revision FROM orders WHERE id='${order}';`));
 return JSON.parse(sql(db,`BEGIN;SET LOCAL ROLE authenticated;SET LOCAL "request.jwt.claim.sub"='${actor}';SELECT order_command('${order}',${rev},'${key}',${literal(action)},${literal(JSON.stringify(data))}::jsonb);COMMIT;`));
}
export function lines(db,order){return JSON.parse(sql(db,`SELECT jsonb_agg(jsonb_build_object('order_item_id',i.order_item_id,'quantity',i.quantity) ORDER BY i.order_item_id) FROM order_quote_items i JOIN orders o ON o.active_quote_id=i.quote_id WHERE o.id='${order}';`));}
export function quote(db,order){return JSON.parse(sql(db,`SELECT to_jsonb(q) FROM order_quotes q JOIN orders o ON o.active_quote_id=q.id WHERE o.id='${order}';`));}
export function approve(db,order,actor=ids.admin){const q=quote(db,order);return command(db,order,'accept_quote',{quote_id:q.id,hash:q.content_hash,amount:q.base_total,simulated_customer_message:'ZZ TEST customer-originated demo acceptance',evidence_source:'customer_message'},actor);}
export function intake(db,order,extra={}){return command(db,order,'intake',{bags:[{tag:'BAG-'+randomUUID(),service_group:'Laundry',count:3,condition:'Synthetic intake condition',flagged:[{tag:'ITEM-'+randomUUID(),description:'Flagged jacket',condition:'Synthetic pre-existing mark'}]}],...extra});}
export function assign(db,order){sql(db,`UPDATE profiles SET role='staff' WHERE id='${ids.staff}';INSERT INTO order_assignments(order_id,staff_id,kind,assigned_by) VALUES('${order}','${ids.staff}','processor','${ids.admin}'),('${order}','${ids.staff}','courier','${ids.admin}');`);}
export function reconcile(db,order){return {bags:JSON.parse(sql(db,`SELECT jsonb_agg(id) FROM laundry_bags WHERE order_id='${order}';`)),items:JSON.parse(sql(db,`SELECT coalesce(jsonb_agg(id),'[]') FROM flagged_items WHERE order_id='${order}';`))};}
export function ready(db,owner=null){const r=book(db,payload(),randomUUID(),owner);intake(db,r.order_id);command(db,r.order_id,'measure',{items:lines(db,r.order_id).map((i,n)=>({...i,quantity:n===0?2.7:i.quantity}))});command(db,r.order_id,'start_work');command(db,r.order_id,'qc',reconcile(db,r.order_id));return r;}
export function collectData(db,order,extra={}){return {...reconcile(db,order),amount:147500,method:'cash',recipient_evidence:'ZZ TEST simulated recipient acknowledgement',...extra};}
export function money(db,order){return JSON.parse(sql(db,`SET ROLE authenticated;SET "request.jwt.claim.sub"='${ids.admin}';SELECT demo_payment_summary('${order}');`));}

import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,sql,book,payload,command,lines,quote,approve,intake,assign,reconcile,ids,randomUUID} from './helpers.mjs';
const kg=(q,extra={})=>payload({items:[{service_id:1,quantity:q}],...extra});

test('P03_TOLERANCE_BOUNDARY — inclusive original kg limits; no-consent changes need exact quote',()=>{
 const {db}=fixture();let n=0;
 for(const [estimated,actual,consent,ok]of [[2,1.7,true,true],[2,2.3,true,true],[2,2.31,true,false],[5,5.5,true,true],[5,5.51,true,false],[2,2.1,false,false],[2,1.9,false,false],[2,2,false,true]]){
  const r=book(db,kg(estimated,{phone:String(n++).padStart(10,'0'),tolerance_consent:consent}));intake(db,r.order_id);
  const data={items:lines(db,r.order_id).map(i=>({...i,quantity:actual}))};
  if(ok)assert.equal(command(db,r.order_id,'measure',data).total,Math.round(actual*25000));
  else assert.throws(()=>command(db,r.order_id,'measure',data),/QUOTE_REQUIRED/);
 }
});
test('P03_TOLERANCE_SCOPE — no rolling/netting/count/fee/rate workaround',()=>{
 const {db}=fixture();const r=book(db,payload({items:[{service_id:1,quantity:2},{service_id:2,quantity:5},{service_id:3,quantity:1}]}));intake(db,r.order_id);const original=lines(db,r.order_id);
 command(db,r.order_id,'measure',{items:original.map((i,n)=>({...i,quantity:n===0?2.3:i.quantity}))});
 for(const changes of [original.map((i,n)=>({...i,quantity:n===0?2.6:i.quantity})),original.map((i,n)=>({...i,quantity:n===0?2.31:n===1?4.69:i.quantity})),original.map((i,n)=>({...i,quantity:n===2?2:i.quantity}))])assert.throws(()=>command(db,r.order_id,'measure',{items:changes}),/QUOTE_REQUIRED/);
 assert.throws(()=>command(db,r.order_id,'measure',{items:original,delivery_fee:1000}),/QUOTE_REQUIRED/);
 assert.throws(()=>command(db,r.order_id,'measure',{items:original.map(i=>({...i,rate:1}))}),/QUOTE_REQUIRED/);
});
test('P03_QUOTE_RACE — stale hash denied; reject/expiry never restores old approval',()=>{
 const {db}=fixture();const r=book(db,kg(2));intake(db,r.order_id);
 const items=lines(db,r.order_id).map(i=>({...i,quantity:2.5}));command(db,r.order_id,'issue_quote',{items});const old=quote(db,r.order_id);
 command(db,r.order_id,'issue_quote',{items:items.map(i=>({...i,quantity:2.6}))});
 assert.throws(()=>command(db,r.order_id,'accept_quote',{quote_id:old.id,hash:old.content_hash,amount:old.base_total}),/QUOTE_SUPERSEDED/);
 command(db,r.order_id,'quote_state',{state:'rejected'});
 const rejected=quote(db,r.order_id);
 assert.throws(()=>sql(db,`UPDATE order_quotes SET state='draft' WHERE id='${rejected.id}';`),/IMMUTABLE/);
 assert.throws(()=>sql(db,`UPDATE order_quotes SET state='issued' WHERE id='${rejected.id}';`),/IMMUTABLE/);
 assert.throws(()=>command(db,r.order_id,'start_work'),/QUOTE_NOT_APPROVED/);
 command(db,r.order_id,'issue_quote',{items});approve(db,r.order_id);command(db,r.order_id,'measure',{items});command(db,r.order_id,'start_work');
 assert.equal(sql(db,`SELECT count(*) FROM order_quotes WHERE order_id='${r.order_id}';`),'4');
});
test('P03_APPROVAL_EVIDENCE — unverified phone note and forged simulation never unlock work',()=>{
 const {db}=fixture();const r=book(db,kg(2),randomUUID(),ids.a);assign(db,r.order_id);intake(db,r.order_id);
 command(db,r.order_id,'issue_quote',{items:lines(db,r.order_id).map(i=>({...i,quantity:2.4}))});const q=quote(db,r.order_id);
 command(db,r.order_id,'phone_note',{message:'Unverified staff phone note'},ids.staff);
 assert.throws(()=>command(db,r.order_id,'start_work'),/QUOTE_NOT_APPROVED/);
 assert.throws(()=>approve(db,r.order_id,ids.staff),/FORBIDDEN/);
 assert.throws(()=>approve(db,r.order_id,ids.b),/FORBIDDEN/);
 assert.throws(()=>command(db,r.order_id,'accept_quote',{quote_id:q.id,hash:q.content_hash,amount:q.base_total}),/EVIDENCE_REQUIRED/);
 approve(db,r.order_id,ids.a);
 assert.equal(sql(db,`SELECT count(*) FROM quote_approvals WHERE quote_id='${q.id}' AND verification_state='unverified';`),'1');
 assert.equal(sql(db,`SELECT count(*) FROM quote_approvals WHERE quote_id='${q.id}' AND verification_state='verified';`),'1');
});
test('P03_SETTLEMENT_IMMUTABLE — weights/charges create new versions; no double charge',()=>{
 const {db}=fixture();const r=book(db,kg(2));intake(db,r.order_id);let items=lines(db,r.order_id).map(i=>({...i,quantity:2.1}));
 command(db,r.order_id,'measure',{items});const first=sql(db,`SELECT active_settlement_id FROM orders WHERE id='${r.order_id}';`);
 items=items.map(i=>({...i,quantity:2.2}));command(db,r.order_id,'measure',{items});
 command(db,r.order_id,'charge',{amount:-5000,reason:'Simulated compensation',simulated_customer_message:'ZZ TEST agrees to synthetic remedy'});
 assert.equal(sql(db,`SELECT total FROM order_settlements WHERE id='${first}';`),'52500');
 assert.throws(()=>sql(db,`UPDATE order_settlements SET total=1 WHERE id='${first}';`),/APPEND_ONLY/);
 assert.equal(command(db,r.order_id,'measure',{items}).total,50000);
 assert.equal(sql(db,`SELECT count(*) FROM settlement_charges WHERE settlement_id=(SELECT active_settlement_id FROM orders WHERE id='${r.order_id}');`),'1');
});
test('P03_BAG_INTEGRITY — unique labels, same-order flagged items, retag evidence and full QC set',()=>{
 const {db}=fixture();const a=book(db,kg(2)),b=book(db,kg(2));intake(db,a.order_id);intake(db,b.order_id);
 const targets=reconcile(db,a.order_id);const old=sql(db,`SELECT tag_id FROM laundry_bags WHERE id='${targets.bags[0]}';`);
 assert.throws(()=>sql(db,`UPDATE flagged_items SET order_id='${b.order_id}' WHERE id='${targets.items[0]}';`),/PERMANENT|foreign key/);
 assert.throws(()=>command(db,a.order_id,'retag',{kind:'bag',target_id:targets.bags[0],tag:old,reason:'Retag condition'}),/TAG_EXISTS/);
 command(db,a.order_id,'retag',{kind:'bag',target_id:targets.bags[0],tag:'BAG-'+randomUUID(),reason:'Replacement label condition'});
 assert.equal(sql(db,`SELECT count(*) FROM custody_events WHERE bag_id='${targets.bags[0]}' AND kind='retag' AND replaced_tag_id='${old}';`),'1');
 assert.equal(sql(db,`SELECT count(*) FROM custody_events WHERE bag_id='${targets.bags[0]}' AND kind='retag' AND evidence_id IS NOT NULL;`),'1');
 command(db,a.order_id,'measure',{items:lines(db,a.order_id)});command(db,a.order_id,'start_work');
 assert.throws(()=>command(db,a.order_id,'qc',{bags:targets.bags,items:[]}),/RECONCILIATION/);
});
test('P03_WORK_TRANSITIONS — assigned roles, blocking issues and accepted admin amendments',()=>{
 const {db}=fixture();const r=book(db,kg(2));assign(db,r.order_id);
 assert.throws(()=>sql(db,`SET ROLE service_role;SELECT update_admin_order('20000000-0000-4000-8000-000000000001','pending','picked_up','${ids.admin}');`),/USE_DEMO_WORKFLOW/);
 assert.throws(()=>command(db,r.order_id,'start_work',{},ids.staff),/INVALID_TRANSITION/);
 intake(db,r.order_id);command(db,r.order_id,'measure',{items:lines(db,r.order_id)},ids.staff);command(db,r.order_id,'start_work',{},ids.staff);
 command(db,r.order_id,'incident',{message:'Synthetic blocking issue',blocking:true},ids.staff);
 assert.throws(()=>command(db,r.order_id,'qc',reconcile(db,r.order_id),ids.staff),/BLOCKING_ISSUE/);
 const issue=sql(db,`SELECT id FROM order_issues WHERE order_id='${r.order_id}';`);
 command(db,r.order_id,'resolve_issue',{issue_id:issue,reason:'Synthetic remedy',simulated_customer_message:'Customer agrees to simulated remedy'});
 const items=lines(db,r.order_id).map(i=>({...i,quantity:2.4}));
 assert.throws(()=>command(db,r.order_id,'issue_quote',{items},ids.staff),/FORBIDDEN/);
 command(db,r.order_id,'issue_quote',{items});assert.throws(()=>command(db,r.order_id,'start_work'),/QUOTE_NOT_APPROVED/);
 approve(db,r.order_id);command(db,r.order_id,'measure',{items});command(db,r.order_id,'start_work');
 assert.equal(command(db,r.order_id,'qc',reconcile(db,r.order_id),ids.staff).status,'ready');
});

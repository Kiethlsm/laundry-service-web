import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,sql,book,payload,randomUUID,literal,ids} from './helpers.mjs';

test('P02_IDEMPOTENT_BOOK — one v0 on retry; changed body conflicts',()=>{
 const {db}=fixture();const key=randomUUID(),body=payload();const first=book(db,body,key),second=book(db,body,key);
 assert.equal(second.code,first.code);assert.equal(first.replayed,false);assert.equal(second.replayed,true);
 assert.throws(()=>book(db,{...body,note:'Changed'},key),/IDEMPOTENCY_CONFLICT/);
 assert.equal(sql(db,'SELECT count(*) FROM order_quotes;'),'1');
 assert.equal(sql(db,'SELECT count(*) FROM orders WHERE is_synthetic;'),'1');
});
test('P02_V0_SNAPSHOT — server snapshots, consent and maximum weight total',()=>{
 const {db}=fixture();const r=book(db);assert.equal(r.total,142500);assert.equal(r.max_weight_total,150000);
 sql(db,'UPDATE services SET price=1,name=\'Changed\' WHERE id=1;');
 const q=JSON.parse(sql(db,`SELECT to_jsonb(q) FROM order_quotes q WHERE id='${r.quote_id}';`));
 assert.equal(q.version,0);assert.equal(q.base_total,142500);assert.equal(q.tolerance_consent,true);
 assert.equal(sql(db,`SELECT snapshot_rate FROM order_quote_items WHERE quote_id='${r.quote_id}' AND snapshot_unit='kg';`),'25000');
 assert.equal(sql(db,`SELECT method||':'||verification_state FROM quote_approvals WHERE quote_id='${r.quote_id}';`),'checkout_consent:declared');
 assert.equal(sql(db,`SELECT customer_id IS NULL AND is_synthetic AND NOT legacy_review_required FROM orders WHERE code='${r.code}';`),'t');
 assert.throws(()=>sql(db,`UPDATE order_quotes SET base_total=1 WHERE id='${r.quote_id}';`),/IMMUTABLE/);
 assert.throws(()=>sql(db,`UPDATE order_quote_items SET quantity=1 WHERE quote_id='${r.quote_id}';`),/IMMUTABLE/);
 const extraItem=sql(db,`INSERT INTO order_items(order_id,service_id,quantity,unit_price) VALUES('${r.order_id}',2,1,35000) RETURNING id;`);
 assert.throws(()=>sql(db,`INSERT INTO order_quote_items(quote_id,order_item_id,snapshot_name,snapshot_unit,snapshot_rate,quantity) VALUES('${r.quote_id}',${extraItem},'Extra','kg',35000,1);`),/IMMUTABLE/);
});
test('P02_INPUT_RULES — invalid carts/time/consent roll back atomically',()=>{
 const {db}=fixture();const invalid=[{pickup:'2000-01-01T00:00:00Z'},{pickup:'9999-01-01T00:00:00Z'},{pickup:'not a date'},{consent:false},{items:[{service_id:3,quantity:1.5}]},{items:[{service_id:1,quantity:1001}]},{items:[{service_id:1,quantity:-1}]},{items:[{service_id:1,quantity:0}]},{items:[{service_id:1,quantity:1},{service_id:1,quantity:1}]},{items:[{service_id:9999,quantity:1}]}];
 for(const extra of [...invalid,{name:123},{address:12345},{items:[{service_id:2147483648,quantity:1}]}])assert.throws(()=>book(db,payload(extra)),/INVALID_|PICKUP_|SERVICE_/);
 assert.equal(sql(db,'SELECT count(*) FROM orders WHERE is_synthetic;'),'0');
});
test('P02_LOOKUP_PRIVACY — code/phone exposes only progress and amount',()=>{
 const {db}=fixture();const r=book(db,payload(),randomUUID(),ids.a);
 const lookup=(phone)=>JSON.parse(sql(db,`SET ROLE service_role;SELECT lookup_demo_order('${r.code}',${literal(phone)});`)||'null');
 assert.deepEqual(Object.keys(lookup('0000000000')).sort(),['code','status','total']);
 assert.equal(lookup('0000000001'),null);
});
test('P02_SHARED_RATE — shared phone cap, independent phone and global demo cap',()=>{
 const {db}=fixture();for(let n=0;n<3;n++)book(db);
 assert.throws(()=>book(db),/ORDER_RATE_LIMIT/);
 assert.ok(book(db,payload({phone:'0000000001'})).code);
 assert.equal(sql(db,'SELECT count(*) FROM orders WHERE is_synthetic;'),'4');
});

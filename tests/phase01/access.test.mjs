import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fixture,sql,concurrentSql,ids,orders,as,value } from './local-db.mjs';

const setup=()=>fixture({baseline:process.env.PHASE01_BASELINE==='1'});
const roleChange=(target,role,active,revision=0,key=randomUUID())=>`SELECT public.manage_profile('${target}','${role}',${active},${revision},'${key}')`;
function assigned(db){sql(db,`UPDATE profiles SET role='staff' WHERE id IN ('${ids.staff}','${ids.other}'); INSERT INTO order_assignments(order_id,staff_id,kind,assigned_by) VALUES ('${orders.a}','${ids.staff}','processor','${ids.admin}'),('${orders.a}','${ids.staff}','courier','${ids.admin}');`);}

test('P01_MIGRATE_EXISTING — preserve legacy amounts/history; consent remains unknown',()=>{
 const {db,before}=setup(); const original=JSON.parse(before);
 const after=JSON.parse(sql(db,"SELECT jsonb_build_object('orders',(SELECT jsonb_agg(to_jsonb(o)-'revision'-'legacy_review_required'-'is_synthetic'-'ready_at'-'delivered_at' ORDER BY id) FROM orders o),'items',(SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM order_items i),'history',(SELECT jsonb_agg(to_jsonb(h) ORDER BY id) FROM order_status_history h));"));
 assert.deepEqual(after,original);
 assert.equal(sql(db,'SELECT bool_and(legacy_review_required AND NOT is_synthetic AND revision=0) FROM orders;'),'t');
 assert.equal(sql(db,"SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('order_assignments','audit_events','idempotency_keys');"),'3');
});

test('P01_RLS_MATRIX — ownership, assignment, projections and unknown actions fail closed',()=>{
 const {db}=setup();assigned(db);
 assert.equal(value(db,ids.a,'SELECT count(id) FROM orders'),'1');
 assert.equal(value(db,ids.b,'SELECT count(id) FROM orders'),'1');
 assert.equal(value(db,ids.staff,'SELECT count(id) FROM orders'),'1');
 assert.equal(value(db,ids.other,'SELECT count(id) FROM orders'),'0');
 assert.equal(value(db,null,'SELECT count(id) FROM orders','anon'),'0');
 assert.equal(value(db,ids.admin,'SELECT count(id) FROM orders'),'3');
 assert.equal(value(db,ids.a,`SELECT can_order_action('${ids.a}','${orders.guest}','read')`),'f');
 assert.equal(value(db,ids.staff,`SELECT can_order_action('${ids.staff}','${orders.a}','refund')`),'f');
 assert.equal(value(db,ids.staff,`SELECT can_order_action('${ids.staff}','${orders.a}','issue_quote')`),'t');
 assert.equal(value(db,ids.admin,`SELECT can_order_action('${ids.admin}','${orders.a}','made_up_action')`),'f');
 assert.equal(value(db,ids.admin,`SELECT can_order_action('${ids.admin}','${orders.a}',NULL)`),'f');
 assert.throws(()=>sql(db,as(ids.staff,'SELECT customer_phone,note FROM orders')),/permission denied/);
 assert.equal(JSON.parse(value(db,ids.a,`SELECT order_contact('${orders.a}')`)).pickup_address,'Synthetic address');
 assert.throws(()=>sql(db,as(ids.b,`SELECT order_contact('${orders.a}')`)),/FORBIDDEN/);
 assert.throws(()=>sql(db,as(ids.staff,`SELECT order_contact('${orders.a}')`)),/FORBIDDEN/);
 assert.throws(()=>sql(db,as(ids.a,`UPDATE profiles SET role='admin' WHERE id='${ids.a}'`)),/permission denied/);
 assert.equal(value(db,ids.a,'SELECT count(*) FROM audit_events'),'0');
 assert.throws(()=>sql(db,as(ids.a,'SELECT * FROM idempotency_keys')),/permission denied/);
 assert.equal(sql(db,`SELECT bool_and(NOT has_function_privilege('anon',p.oid,'EXECUTE') AND NOT EXISTS(SELECT FROM aclexplode(p.proacl) a WHERE a.grantee=0)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','app_private') AND p.proname IN ('manage_profile','current_profile_role','can_order_action','order_contact','actor_can','append_only','protect_last_admin','log_order_status','create_guest_order','update_admin_order');`),'t');
 assert.throws(()=>sql(db,as(ids.a,`SELECT app_private.actor_can('${ids.admin}','${orders.a}','refund')`)),/permission denied/);
});

test('P01_SERVICE_ROLE_GUARD — forged actors and anonymous privileged RPCs are denied',()=>{
 const {db}=setup();assigned(db);
 assert.equal(value(db,ids.a,`SELECT can_order_action('${ids.admin}','${orders.a}','refund')`),'f');
 assert.throws(()=>sql(db,as(ids.a,roleChange(ids.a,'admin',true))),/FORBIDDEN/);
 assert.throws(()=>sql(db,as(null,roleChange(ids.a,'admin',true),'anon')),/permission denied/);
 assert.throws(()=>sql(db,as(ids.a,`SELECT update_admin_order('${orders.a}','pending','picked_up','${ids.admin}')`)),/permission denied/);
 assert.throws(()=>sql(db,as(null,`SELECT create_guest_order('ZZ TEST','0000000000','Synthetic address',now()+interval '1 day','cash',NULL,'[{"service_id":1,"quantity":1}]')`,'anon')),/permission denied/);
 assert.equal(value(db,ids.admin,'SELECT current_profile_role()'),'admin');
 assert.equal(value(db,ids.a,'SELECT current_profile_role()'),'customer');
 sql(db,`BEGIN;SET LOCAL ROLE service_role;SELECT update_admin_order('${orders.a}','pending','picked_up','${ids.admin}');COMMIT;`);
 assert.equal(sql(db,`SELECT changed_by FROM order_status_history WHERE order_id='${orders.a}' AND status='picked_up';`),ids.admin);
 sql(db,`UPDATE profiles SET is_active=false WHERE id='${ids.admin2}';`);
 assert.throws(()=>sql(db,as(null,`SELECT update_admin_order('${orders.b}','pending','picked_up','${ids.admin2}')`,'service_role')),/FORBIDDEN/);
});

test('P01_REVOKE_AND_LAST_ADMIN — immediate revocation, revision/retry integrity and serialized admin race',async()=>{
 const {db}=setup();assigned(db);
 const key=randomUUID();
 sql(db,`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${ids.admin}',true);${roleChange(ids.staff,'staff',false,0,key)};COMMIT;`);
 assert.equal(value(db,ids.staff,`SELECT can_order_action('${ids.staff}','${orders.a}','issue_quote')`),'f');
 assert.equal(value(db,ids.staff,'SELECT current_profile_role()'),'');
 assert.throws(()=>sql(db,as(ids.staff,roleChange(ids.a,'admin',true))),/FORBIDDEN/);
 // Retry must return its original response, without a second audit/revision.
 assert.equal(JSON.parse(value(db,ids.admin,roleChange(ids.staff,'staff',false,0,key))).revision,1);
 assert.throws(()=>sql(db,as(ids.admin,roleChange(ids.staff,'staff',true,0,key))),/IDEMPOTENCY_CONFLICT/);
 assert.throws(()=>sql(db,as(ids.admin,roleChange(ids.staff,'staff',true,0))),/REVISION_CONFLICT/);
 assert.equal(sql(db,"SELECT count(*) FROM audit_events WHERE action='manage_profile';"),'1');
 assert.throws(()=>sql(db,'UPDATE audit_events SET action=\'changed\';'),/APPEND_ONLY/);
 assert.throws(()=>sql(db,'DELETE FROM order_status_history;'),/APPEND_ONLY/);
 sql(db,`UPDATE order_assignments SET ended_at=now() WHERE staff_id='${ids.staff}';UPDATE profiles SET is_active=true WHERE id='${ids.staff}';`);
 assert.equal(value(db,ids.staff,`SELECT can_order_action('${ids.staff}','${orders.a}','issue_quote')`),'f');
 const disable=(actor,target)=>`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claim.sub','${actor}',true);${roleChange(target,'admin',false)};SELECT pg_sleep(0.1);COMMIT;`;
 const race=await Promise.all([concurrentSql(db,disable(ids.admin,ids.admin)),concurrentSql(db,disable(ids.admin2,ids.admin2))]);
 assert.equal(race.filter(r=>r.status===0).length,1);
 assert.match(race.find(r=>r.status!==0).err,/LAST_ACTIVE_ADMIN/);
 assert.equal(sql(db,"SELECT count(*) FROM profiles WHERE role='admin' AND is_active;"),'1');
});

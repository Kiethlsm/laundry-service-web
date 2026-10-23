import test from 'node:test';import assert from 'node:assert/strict';import {fixture,sql,ids,as,book,payload,randomUUID} from '../domain/helpers.mjs';
test('S01_PROFILE_PROVISION — verified identity creates customer only; existing admin preserved; disabled/anon denied',()=>{
 const {db}=fixture();sql(db,"ALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz, ADD COLUMN raw_user_meta_data jsonb DEFAULT '{}';");
 const fresh='10000000-0000-4000-8000-000000000099';sql(db,`INSERT INTO auth.users(id,email_confirmed_at,raw_user_meta_data) VALUES('${fresh}',now(),'{"role":"admin","full_name":"ZZ TEST"}');`);
 const invoke=id=>JSON.parse(sql(db,`BEGIN;SET LOCAL ROLE authenticated;SET LOCAL "request.jwt.claim.sub"='${id}';SELECT ensure_customer_profile();COMMIT;`));
 assert.equal(invoke(fresh).role,'customer');assert.equal(invoke(fresh).role,'customer');assert.equal(invoke(ids.admin).role,'admin');assert.equal(sql(db,`SELECT role FROM profiles WHERE id='${ids.admin}';`),'admin');
 const unverified='10000000-0000-4000-8000-000000000098';sql(db,`INSERT INTO auth.users(id) VALUES('${unverified}');`);assert.throws(()=>invoke(unverified),/VERIFIED_IDENTITY_REQUIRED/);
 sql(db,`UPDATE profiles SET is_active=false WHERE id='${fresh}';`);assert.throws(()=>invoke(fresh),/FORBIDDEN/);
 for(const role of ['anon','service_role'])assert.throws(()=>sql(db,`SET ROLE ${role};SELECT ensure_customer_profile();`),/permission denied/);
 assert.equal(sql(db,"SELECT count(*) FROM pg_proc WHERE proname IN ('ensure_customer_profile','customer_dashboard') AND (has_function_privilege('anon',oid,'EXECUTE') OR EXISTS(SELECT FROM aclexplode(proacl) a WHERE a.grantee=0) OR NOT EXISTS(SELECT FROM unnest(proconfig) x WHERE x LIKE 'search_path=%'));"),'0');
});
test('S01_CUSTOMER_ISOLATION — dashboard has own orders only, never attaches same-phone guest; disabled cannot read',()=>{
 const {db}=fixture();const a=book(db,payload(),randomUUID(),ids.a);const guest=book(db,payload());const b=book(db,payload(),randomUUID(),ids.b);
 const read=id=>JSON.parse(sql(db,as(id,'SELECT customer_dashboard()')));const dashboard=read(ids.a);
 assert.ok(dashboard.orders.some(o=>o.id===a.order_id));assert.ok(!dashboard.orders.some(o=>[guest.order_id,b.order_id].includes(o.id)));assert.ok(dashboard.orders.every(o=>!('customer_phone' in o)&&!('pickup_address' in o)));
 assert.equal(sql(db,`SELECT customer_id IS NULL FROM orders WHERE id='${guest.order_id}';`),'t');assert.throws(()=>read(ids.admin),/FORBIDDEN/);sql(db,`UPDATE profiles SET is_active=false WHERE id='${ids.a}';`);assert.throws(()=>read(ids.a),/FORBIDDEN/);assert.throws(()=>sql(db,'SET ROLE anon;SELECT customer_dashboard();'),/permission denied/);
});

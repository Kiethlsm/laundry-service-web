import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,sql,ids,orders,value} from './local-db.mjs';

// Independent expected cells transcribed from v1.2, not generated from SQL.
export const actions=['read','intake','measure','issue_quote','start_work','qc','issue_amendment','accept_quote','deliver_collect','incident','request','cancel','refund','reverse','waive','simulate','manage_order'];
const all=actions.join(' ');
const rows=[
 ['guest',null,'anon',''],
 ['owner',ids.a,'authenticated','read accept_quote request'],
 ['unrelated',ids.b,'authenticated',''],
 ['processor','30000000-0000-4000-8000-000000000001','authenticated','read measure issue_quote start_work qc incident'],
 ['courier','30000000-0000-4000-8000-000000000002','authenticated','read intake deliver_collect incident'],
 ['both',ids.staff,'authenticated','read intake measure issue_quote start_work qc deliver_collect incident'],
 ['unassigned',ids.other,'authenticated',''],
 ['disabled_staff','30000000-0000-4000-8000-000000000003','authenticated',''],
 ['admin',ids.admin,'authenticated',all],
 ['disabled_admin','30000000-0000-4000-8000-000000000004','authenticated','']
];
test('P01_AUTHORIZATION_MATRIX — 170 explicit role/action cells plus 20 null/unknown denials',()=>{
 const {db}=fixture();
 const extra=rows.filter(r=>r[1]?.startsWith('3000'));
 sql(db,`INSERT INTO auth.users VALUES ${extra.map(r=>`('${r[1]}')`).join(',')};
 INSERT INTO profiles(id,role,is_active) VALUES ${extra.map(r=>`('${r[1]}','${r[0]==='disabled_admin'?'admin':'staff'}',${!r[0].startsWith('disabled')})`).join(',')};
 UPDATE profiles SET role='staff' WHERE id IN ('${ids.staff}','${ids.other}');`);
 for(const name of ['processor','courier','both','disabled_staff']) {
  const actor=rows.find(r=>r[0]===name)[1];
  for(const kind of name==='both'?['processor','courier']:[name==='courier'?'courier':'processor'])
   sql(db,`INSERT INTO order_assignments(order_id,staff_id,kind,assigned_by) VALUES('${orders.a}','${actor}','${kind}','${ids.admin}');`);
 }
 for(const [name,actor,role,allowed] of rows) {
  // anon cannot EXECUTE helpers at all; denial is stronger than false.
  if(role==='anon') {
   for(const action of [...actions,'unknown',null]) assert.throws(()=>value(db,null,`SELECT can_order_action(NULL,'${orders.a}',${action===null?'NULL':`'${action}'`})`,role),/permission denied/,`${name}/${action}`);
   continue;
  }
  const actual=JSON.parse(value(db,actor,`SELECT jsonb_object_agg(action,can_order_action('${actor}','${orders.a}',action)) FROM unnest(ARRAY[${[...actions,'unknown'].map(a=>`'${a}'`).join(',')}]) AS t(action)`));
  for(const action of actions) assert.equal(actual[action],allowed.split(' ').includes(action),`${name}/${action}`);
  assert.equal(actual.unknown,false,name+'/unknown');
  assert.equal(value(db,actor,`SELECT can_order_action('${actor}','${orders.a}',NULL)`),'f',name+'/null');
 }
 console.log('AUTHORIZATION_MATRIX '+JSON.stringify({covered:170,total:170,extra_unknown_null:20,source:'v1.2 single access matrix; permission checks, not transition preconditions'}));
});

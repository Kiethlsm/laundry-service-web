import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
import {manifests,validateGate} from '../../scripts/gate-manifest.mjs';
import {fixture,sql,book,payload,command,ready,collectData,lines,approve,ids,as,randomUUID} from './helpers.mjs';

test('P09_REGRESSION — cumulative manifests reject omissions and synthetic legacy status bypass remains closed',()=>{
 for(const [phase,manifest]of Object.entries(manifests)){
  const output=manifest.required.map((id,n)=>`ok ${n+1} - ${id} — proof\n`).join('');
  assert.equal(validateGate(output,0,phase),true);
  for(const id of manifest.required)assert.equal(validateGate(output.split('\n').filter(l=>!l.includes(' - '+id+' ')).join('\n'),0,phase),false,phase+'/'+id);
 }
 const {db}=fixture();const r=book(db);assert.throws(()=>sql(db,`SET ROLE service_role;SELECT update_admin_order('${r.order_id}','pending','picked_up','${ids.admin}');`),/USE_DEMO_WORKFLOW/);
});
test('P09_PROJECTIONS_LOGS — unrelated/private evidence denied and financial failures emit safe metadata',async()=>{
 const {db}=fixture();const r=book(db,payload(),randomUUID(),ids.a);
 assert.throws(()=>sql(db,as(ids.b,`SELECT demo_order_detail('${r.order_id}')`)),/FORBIDDEN/);
 assert.equal(sql(db,as(ids.a,'SELECT count(*) FROM evidence;')),'0');
 const out={},logs=[];const privateMessage='PRIVATE_SECRET phone=0000000000 customer=ZZ TEST address=PRIVATE_ADDRESS';
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/admin/demo-actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:out,console:{error:l=>logs.push(l)},require:n=>n==='@/lib/admin'?{requireAdmin:async()=>({})}:n==='@/lib/supabase-server'?{authClient:async()=>({rpc:async()=>({data:null,error:{message:privateMessage}})})}:{revalidatePath:()=>{}}});
 const form=new FormData();for(const [key,value]of Object.entries({order_id:r.order_id,revision:'0',operation_key:randomUUID(),action:'receipt',amount:'10000',method:'cash'}))form.set(key,value);
 const response=await out.performDemoAction({error:''},form);
 assert.ok(response.error);assert.equal(logs.length,1);assert.doesNotMatch(logs.join(''),/PRIVATE_|0000000000|ZZ TEST/);assert.equal(JSON.parse(logs[0]).rpc,'order_command');
});
test('P09_STATE_COVERAGE — a new ready-stage amendment invalidates old work/QC scope without moving status backward',()=>{
 const {db}=fixture();const r=ready(db);const changed=lines(db,r.order_id).map((i,n)=>({...i,quantity:n===0?3:i.quantity}));
 command(db,r.order_id,'issue_quote',{items:changed});approve(db,r.order_id);command(db,r.order_id,'measure',{items:changed});
 assert.throws(()=>command(db,r.order_id,'deliver_collect',collectData(db,r.order_id,{amount:155000})),/QC_REQUIRED|WORK_SCOPE_REQUIRED/);
 command(db,r.order_id,'start_work');command(db,r.order_id,'qc',{...collectData(db,r.order_id)});
 assert.equal(command(db,r.order_id,'deliver_collect',collectData(db,r.order_id,{amount:155000})).status,'delivered');
 assert.equal(sql(db,`SELECT string_agg(status::text,',' ORDER BY id) FROM order_status_history WHERE order_id='${r.order_id}';`),'pending,picked_up,processing,ready,delivered');
 const rules=fs.readFileSync('docs/pipeline-v1.2/contracts.md','utf8');for(let n=1;n<=8;n++)assert.ok(rules.includes('| T'+n+' |'));
});

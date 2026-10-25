import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
const native=createRequire(import.meta.url);
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,crypto:globalThis.crypto,require:n=>mocks[n]??native(n)});return exports;}
test('P03_ADMIN_DETAIL_UI — version/consent/evidence UI and role-free action payload',async()=>{
 const {DemoWorkspace}=load('components/demo-workspace.tsx',{'./workflow-panels':load('components/workflow-panels.tsx',{'@/lib/action-guidance':load('lib/action-guidance.ts'),'@/lib/format':load('lib/format.ts')}),'@/lib/action-guidance':load('lib/action-guidance.ts'),'@/lib/admin-operations':load('lib/admin-operations.ts'),'./demo-action-form':{DemoActionForm:({children})=>React.createElement('form',null,children)},'./demo-money':{DemoMoney:()=>null},'@/lib/format':{formatVND:n=>String(n),UNIT_LABEL:{kg:'kg'}}});
 const data={order:{id:'20000000-0000-4000-8000-000000000001',revision:2,status:'picked_up',total:50000},eligible:false,quotes:[{id:'q',version:1,state:'issued',base_total:50000,max_weight_total:50000,content_hash:'hash',tolerance_consent:false,items:[{order_item_id:1,snapshot_name:'Laundry',snapshot_unit:'kg',snapshot_rate:25000,quantity:2},{order_item_id:2,snapshot_name:'Shoes',snapshot_unit:'doi',snapshot_rate:80000,quantity:1}],approvals:[{verification_state:'unverified',method:'phone_note'}]}],bags:[],settlements:[],charges:[],issues:[],custody:[]};
 const html=renderToStaticMarkup(React.createElement(DemoWorkspace,{data}));
 for(const text of ['Báo giá','Lần 2','mô phỏng','Chưa xác minh','quantity:1'])assert.ok(html.includes(text),text);
 const discrete=html.match(/<input\b[^>]*name="quantity:2"[^>]*>/)?.[0];
 assert.match(discrete,/min="1"/);
 assert.match(discrete,/step="1"/);
 data.bags=[{id:'bag',tag_id:'BAG-1',service_group:'Laundry',item_count:1,intake_condition:'Synthetic intake',custody_state:'received',items:[]}];
 data.issues=[{id:'issue',type:'Synthetic resolved issue',state:'resolved',blocking:false}];
 assert.ok(renderToStaticMarkup(React.createElement(DemoWorkspace,{data})).includes('Miễn đối chiếu'));
 let captured;const action=load('app/admin/demo-actions.ts',{'@/lib/admin':{requireAdmin:async()=>({})},'@/lib/supabase-server':{authClient:async()=>({rpc:async(name,args)=>{captured={name,args};return {data:{revision:3},error:null};}})},'next/cache':{revalidatePath:()=>{}}});
 const form=new FormData();for(const [k,v]of Object.entries({order_id:data.order.id,revision:'2',operation_key:crypto.randomUUID(),action:'measure',item_id:'1','quantity:1':'2.3',actor:'forged'}))form.set(k,v);
 const result=await action.performDemoAction({error:''},form);assert.equal(result.error,'');assert.equal(captured.name,'order_command');assert.equal(captured.args.p_data.items[0].quantity,2.3);assert.equal(Object.hasOwn(captured.args,'p_actor'),false);
});

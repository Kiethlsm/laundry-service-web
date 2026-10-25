import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
test('ACTION_RESPONSE_GUARD — success carries the RPC revision, malformed/error results never acknowledge a saved version',async()=>{
 const exports={};let result={data:{revision:4},error:null},guards=0;
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/admin/demo-actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,console,require:n=>n==='@/lib/admin'?{requireAdmin:async()=>{guards++;}}:n==='next/cache'?{revalidatePath:()=>{}}:{authClient:async()=>({rpc:async()=>result})}});
 const form=new FormData();for(const [k,v]of Object.entries({order_id:'20000000-0000-4000-8000-000000000001',operation_key:'90000000-0000-4000-8000-000000000001',revision:'2',action:'measure',item_id:'1','quantity:1':'2.5'}))form.set(k,v);
 assert.equal((await exports.performDemoAction({error:''},form)).revision,4);
 result={data:{},error:null};const malformed=await exports.performDemoAction({error:''},form);assert.ok(malformed.error);assert.equal(malformed.success,undefined);
 result={data:null,error:{message:'REVISION_CONFLICT'}};const rejected=await exports.performDemoAction({error:''},form);assert.ok(rejected.error);assert.equal(rejected.revision,undefined);assert.equal(guards,3);
});
function load(){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/action-guidance.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}
test('ACTION_CONSEQUENCES — only valid order transitions change stages; other actions explain their own effect',()=>{
 const {actionGuidance}=load();
 for(const [action,before,after] of [['intake','pending','picked_up'],['start_work','picked_up','processing'],['qc','processing','ready'],['deliver_collect','ready','delivered'],['cancel','picked_up','cancelled']])assert.equal(actionGuidance(action,before).nextStatus,after);
 for(const action of ['measure','receipt','refund','reverse','accept_quote','phone_note','charge'])assert.equal(actionGuidance(action,'picked_up').nextStatus,'picked_up');
 assert.equal(actionGuidance('start_work','ready').nextStatus,'ready');
 assert.equal(actionGuidance('intake','processing').nextStatus,'processing');
 assert.match(actionGuidance('intake','pending').bagEffect,/giữ/);
 assert.match(actionGuidance('deliver_collect','ready').bagEffect,/trả/);
 assert.match(actionGuidance('phone_note','picked_up').help,/không/);
});
test('BAG_PRESENTATION — custody is separate from shared order progress and unknown custody is not marked returned',()=>{
 const {bagPresentation}=load();
 assert.equal(bagPresentation({custody_state:'received',qc_completed:false}).custody,'Tiệm đang giữ bọc');
 assert.equal(bagPresentation({custody_state:'returned',qc_completed:true}).custody,'Đã trả khách');
 assert.equal(bagPresentation({custody_state:'unexpected',qc_completed:true}).custody,'Cần kiểm tra hồ sơ');
 assert.match(bagPresentation({custody_state:'received',qc_completed:false}).check,/Chưa/);
});

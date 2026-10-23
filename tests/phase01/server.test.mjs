import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('P01_SERVER_SESSION_GUARD — real admin guard checks live session capability on every invocation',async()=>{
 let active=true,calls=0;
 const exports={};const code=ts.transpileModule(fs.readFileSync('lib/admin.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const user={id:'verified-session-id'};
 const auth={auth:{getUser:async()=>({data:{user},error:null})},rpc:async(name)=>{assert.equal(name,'current_profile_role');calls++;return {data:active?'admin':null,error:null};}};
 const db={from:()=>({select:()=>({eq:()=>({single:async()=>({data:{role:'admin'},error:null})})})})};
 vm.runInNewContext(code,{exports,require:name=>name==='server-only'?{}:name==='next/navigation'?{redirect:()=>{throw new Error('REDIRECT');}}:{authClient:async()=>auth,isConfigured:()=>true,serviceClient:()=>db}});
 assert.equal((await exports.requireAdmin()).user.id,user.id);
 active=false;await assert.rejects(exports.requireAdmin(),/REDIRECT/);assert.equal(calls,2);
 // Exercise the real Server Action: form-provided actor/role never reach the RPC.
 const actions={};let writes=0;
 db.rpc=async(name,args)=>{assert.equal(name,'update_admin_order');assert.equal(args.p_actor,user.id);writes++;return {error:null};};
 const actionCode=ts.transpileModule(fs.readFileSync('app/admin/actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(actionCode,{exports:actions,require:name=>
  name==='next/navigation'?{redirect:()=>{throw new Error('REDIRECT');}}:
  name==='next/cache'?{revalidatePath:()=>{}}:
  name==='@/lib/admin'?exports:
  name==='@/lib/format'?{STATUS_LABEL:{pending:'pending',picked_up:'picked_up'},nextStatuses:()=>['picked_up']}:
  {authClient:async()=>auth,isConfigured:()=>true}});
 const submitted={id:'20000000-0000-4000-8000-000000000001',expected:'pending',target:'picked_up',actor:'forged-admin',role:'admin'};
 active=true;await actions.updateStatus({error:''},{get:key=>submitted[key]});assert.equal(writes,1);
 active=false;await assert.rejects(actions.updateStatus({error:''},{get:key=>submitted[key]}),/REDIRECT/);assert.equal(writes,1);
});

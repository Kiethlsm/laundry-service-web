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
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {payload,randomUUID} from './helpers.mjs';

test('P02_HTTP_CONTRACT — status/retry/validation and safe unavailable errors',async()=>{
 const out={};let error=null,calls=0,replayed=false;
 const db={rpc:async(name)=>{assert.equal(name,'book_demo_order');calls++;return {data:{code:'LD1234',total:142500,max_weight_total:150000,quote_id:randomUUID(),order_id:randomUUID(),replayed},error};}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/orders/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:out,Request,Response,Date,console,require:()=>({isConfigured:()=>true,serviceClient:()=>db})});
 const request=(body=payload(),key=randomUUID())=>new Request('http://localhost/api/orders',{method:'POST',headers:{'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:JSON.stringify(body)});
 assert.equal((await out.POST(request(payload(),null))).status,400);assert.equal(calls,0);
 assert.equal((await out.POST(request(payload({pickup:'2027-01-01T10:00:00'})))).status,400);
 assert.equal((await out.POST(request())).status,201);replayed=true;assert.equal((await out.POST(request())).status,200);
 for(const [message,status]of [['IDEMPOTENCY_CONFLICT',409],['PICKUP_NOT_FUTURE',400],['ORDER_RATE_LIMIT',429],['PRIVATE_NETWORK api_key=secret phone=0000000000',503]]) {
  error={message};const response=await out.POST(request());assert.equal(response.status,status);assert.doesNotMatch(JSON.stringify(await response.json()),/PRIVATE_NETWORK|api_key|secret|0000000000/);
 }
});

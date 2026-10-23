import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {createRequire} from 'node:module';
const native=createRequire(import.meta.url);
test('P05_LEDGER_UI — immutable history/derived balance, receipt references and handover checklist',()=>{
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/demo-money.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:n=>n==='./demo-action-form'?{DemoActionForm:({children,label})=>React.createElement('form',{'aria-label':label},children)}:n==='@/lib/format'?{formatVND:n=>String(n),formatDate:s=>s}:native(n)});
 const data={order:{id:'o',revision:1,status:'ready',total:50000},bags:[{id:'b',tag_id:'BAG-1',items:[{id:'f',tag_id:'ITEM-1'}]}],money:{status:'partial',balance:40000,net_received:10000,settlement_total:50000,entries:[{id:'r',kind:'receipt',amount:10000,signed_effect:10000,method:'cash',effective_at:'2026-01-01T00:00:00Z'}]}};
 const html=renderToStaticMarkup(React.createElement(exports.DemoMoney,{data}));
 for(const text of ['Sổ tiền','mô phỏng','Còn phải thu','40000','Giao đồ và thu tiền','recipient_evidence','original_id','bag_id','flagged_id'])assert.ok(html.includes(text),text);
 assert.equal(html.includes('name="paid"'),false);
 data.money.balance=-10000;data.money.status='refund_due';const due=renderToStaticMarkup(React.createElement(exports.DemoMoney,{data}));assert.equal(due.includes('aria-label="Giao đồ và thu tiền"'),false);
});

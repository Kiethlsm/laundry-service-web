import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {createRequire} from 'node:module';
const native=createRequire(import.meta.url);
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,URL,require:n=>mocks[n]??native(n)});return exports;}
test('SHOP_CONTACT — confirmed phone, encoded address and external Google Maps pin',()=>{
 const {SHOP}=load('lib/shop.ts');assert.equal(SHOP.phone,'0903992813');assert.equal(SHOP.address,'104/4G Nhất Chi Mai, phường Tân Bình, Thành phố Hồ Chí Minh');
 const u=new URL(SHOP.mapsUrl);assert.equal(u.origin,'https://www.google.com');assert.equal(u.pathname,'/maps/search/');assert.equal(u.searchParams.get('api'),'1');assert.equal(u.searchParams.get('query'),SHOP.address);
 const {ShopContact}=load('components/shop-contact.tsx',{'@/lib/shop':{SHOP}});const html=renderToStaticMarkup(React.createElement(ShopContact));assert.match(html,/href="tel:0903992813"/);assert.match(html,/104\/4G Nhất Chi Mai/);assert.match(html,/noopener noreferrer/);assert.match(html,/Google Maps/);assert.doesNotMatch(html,/iframe|API_KEY/);
});
test('ADMIN_NEXT_ACTION — next step follows existing approval, weight, QC, refund and custody preconditions',()=>{
 const {nextAdminAction}=load('lib/admin-operations.ts');
 const base={order:{status:'pending',active_quote_id:'q',work_quote_id:'q',qc_quote_id:'q'},eligible:true,quotes:[{id:'q',version:0}],issues:[],bags:[],settlements:[],money:{settlement_total:null,balance:null,status:'awaiting_settlement'}};
 const check=(patch,id,words)=>{const x=nextAdminAction({...base,...patch});assert.equal(x.panel,id);assert.match(x.title,words);};
 check({},'bags',/Nhận/);check({order:{...base.order,status:'picked_up'}},'quotes',/Cân/);
 check({order:{...base.order,status:'picked_up'},eligible:false},'quotes',/khách/);
 check({order:{...base.order,status:'picked_up'},money:{settlement_total:100,balance:100,status:'unpaid'}},'bags',/Bắt đầu/);
 check({order:{...base.order,status:'processing'}},'bags',/Kiểm tra/);
 check({order:{...base.order,status:'processing',work_quote_id:'old'},quotes:[{id:'q',is_amendment:true}]},'bags',/Bắt đầu phần việc bổ sung/);
 check({order:{...base.order,status:'ready'},money:{settlement_total:100,balance:-10,status:'refund_due'}},'payments',/Hoàn/);
 check({order:{...base.order,status:'ready'},money:{settlement_total:100,balance:100,status:'unpaid'}},'payments',/Bàn giao/);
 check({order:{...base.order,status:'ready',qc_quote_id:'old'},money:{settlement_total:100,balance:0,status:'paid'}},'bags',/Kiểm tra/);
 check({issues:[{state:'open',blocking:true}]},'issues',/sự cố/);
 check({order:{...base.order,status:'delivered'}},'payments',/hoàn tất/);
 check({order:{...base.order,status:'cancelled'},bags:[{custody_state:'received'}]},'bags',/trả/);
});
test('ADMIN_GROUPS — all six states have exactly one work group; filters never invent totals',()=>{
 const {ORDER_GROUPS,groupForStatus}=load('lib/admin-operations.ts');
 const states=['pending','picked_up','processing','ready','delivered','cancelled'];
 for(const status of states)assert.equal(ORDER_GROUPS.filter(g=>g.statuses.includes(status)).length,1,status);
 assert.equal(groupForStatus('picked_up'),'working');assert.equal(groupForStatus('processing'),'working');
 assert.equal(groupForStatus('unknown'),null);
});

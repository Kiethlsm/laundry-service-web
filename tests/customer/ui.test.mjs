import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {createRequire} from 'node:module';const native=createRequire(import.meta.url);
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:n=>mocks[n]??native(n)});return exports;}
test('S01_CUSTOMER_UI — Google is primary, guest stays available, provider errors hidden and own order/empty states explicit',async()=>{
 const link=({href,children,...p})=>React.createElement('a',{href,...p},children);
 const {default:Login}=load('app/dang-nhap/page.tsx',{'next/link':{default:link},'@/lib/supabase-server':{isConfigured:()=>true}});
 const html=renderToStaticMarkup(await Login({searchParams:Promise.resolve({reason:'failed',error_description:'PRIVATE_PROVIDER_TOKEN'})}));assert.match(html,/Tiếp tục với Google/);assert.match(html,/href="\/auth\/google"/);assert.match(html,/href="\/dat-lich"/);assert.doesNotMatch(html,/PRIVATE_PROVIDER_TOKEN|type="password"|name="otp"/);
 const {CustomerOrders}=load('components/customer-orders.tsx',{'next/link':{default:link},'@/lib/format':{formatVND:n=>n+'đ',formatDate:()=> 'Tomorrow'},'@/components/ui':{StatusBadge:({status})=>React.createElement('span',null,status)}});
 assert.match(renderToStaticMarkup(React.createElement(CustomerOrders,{orders:[]})),/Chưa có đơn trong tài khoản/);
 const ordered=renderToStaticMarkup(React.createElement(CustomerOrders,{orders:[{id:'id',code:'LD1234',status:'pending',total:50000,created_at:'2026-01-01'}]}));assert.match(ordered,/LD1234/);assert.match(ordered,/50000/);assert.doesNotMatch(ordered,/Sửa quyền|Nhân viên/);
 assert.match(fs.readFileSync('.github/workflows/portfolio-ci.yml','utf8'),/npm run test:customer/);
});

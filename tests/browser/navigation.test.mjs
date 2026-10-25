import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browser,until,delay} from './cdp.mjs';
import {localSite} from './local-site.mjs';
import {sql,payload,randomUUID} from '../domain/helpers.mjs';

test('NAVIGATION_PRODUCTION — public cache and real production prefetch under slow catalog',async t=>{
 const site=await localSite({production:true,catalogDelayMs:1500});let p;
 const evidence={};
 try{
  await t.test('PUBLIC_CATALOG_REUSE — repeat home and pricing reads reuse public catalog',async()=>{
   for(const route of['/','/bang-gia'])await(await fetch(site.base+route)).text();
   const before=site.catalogRequests.length;
   for(const route of['/','/bang-gia'])assert.equal((await fetch(site.base+route)).status,200);
   evidence.repeatCatalogReads=site.catalogRequests.length-before;
   assert.equal(evidence.repeatCatalogReads,0,'unchanged public prices must not re-query Supabase on every page visit');
  });
  await t.test('PUBLIC_PREFETCH — warmed booking navigation does not wait for the 1500ms catalog',async()=>{
   p=await browser();await p.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
   await p.send('Page.navigate',{url:site.base+'/'});
   await until(()=>p.evaluate("Object.keys(document.querySelector('.navigation a')??{}).some(k=>k.startsWith('__reactProps'))"));
   await until(()=>p.evaluate("performance.getEntriesByType('resource').some(r=>r.name.includes('/dat-lich?')&&r.name.includes('_rsc')&&r.responseEnd>0)"));
   await delay(150);
   evidence.prefetchedBookingMs=await p.evaluate(`new Promise(resolve=>{
    const started=performance.now();document.querySelector('.navigation a[href="/dat-lich"]').click();
    const timer=setInterval(()=>{if(location.pathname==='/dat-lich'&&document.querySelector('.booking-layout')?.checkVisibility()){clearInterval(timer);resolve(Math.round(performance.now()-started));}else if(performance.now()-started>10000){clearInterval(timer);resolve(10000);}},10);
   })`);
   assert.ok(evidence.prefetchedBookingMs<750,'fully prefetched booking should open below750ms despite1500ms upstream latency: '+evidence.prefetchedBookingMs);
  });
  await t.test('LIVE_ORDER_PRICING — cached display never sets the authoritative order price',async()=>{
   const oldPrice=Number(sql(site.db,'SELECT price FROM services WHERE id=1;'));
   const shoePrice=Number(sql(site.db,'SELECT price FROM services WHERE id=3;'));
   try{
    sql(site.db,`UPDATE services SET price=${oldPrice+1000} WHERE id=1;`);
    const response=await fetch(site.base+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':randomUUID()},body:JSON.stringify(payload())});
    assert.equal(response.status,201);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const result=await response.json();
    evidence.freshOrderTotal=result.total;
    assert.equal(result.total,(oldPrice+1000)*2.5+shoePrice);
   }finally{sql(site.db,`UPDATE services SET price=${oldPrice} WHERE id=1;`);}
  });
 }finally{
  fs.mkdirSync('docs/verification/navigation',{recursive:true});fs.writeFileSync('docs/verification/navigation/local-measurements.json',JSON.stringify(evidence,null,2));
  p?.close();await site.close();
 }
});

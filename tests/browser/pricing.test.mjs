import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browser,until} from './cdp.mjs';
import {localSite} from './local-site.mjs';
import {sql} from '../domain/helpers.mjs';

const dir='docs/verification/readable-pricing';
const money=n=>new Intl.NumberFormat('vi-VN').format(n)+'đ';
const units={kg:'kg',cai:'cái',doi:'đôi',bo:'bộ'};

test('PRICING_DATA — exact catalog rates, units and estimates have associated table headers',async()=>{
 const site=await localSite();let page;
 try{
  const rows=JSON.parse(sql(site.db,'SELECT jsonb_agg(s ORDER BY id) FROM services s WHERE is_active;'));
  page=await browser();await page.send('Page.navigate',{url:site.base+'/bang-gia'});
  await until(()=>page.evaluate("Boolean(document.querySelector('#noi-dung h1'))"));
  assert.equal(await page.evaluate("document.querySelectorAll('table[data-price-table]').length"),6,'Every service group needs a labelled data table');
  const actual=await page.evaluate("[...document.querySelectorAll('[data-service-id]')].map(r=>({id:Number(r.dataset.serviceId),name:r.querySelector('th[scope=row] [data-service-name]')?.textContent,price:r.querySelector('[data-price]')?.textContent,unit:r.querySelector('[data-unit]')?.textContent.replace(/\\s/g,''),hours:r.querySelector('[data-hours]')?.textContent}))");
  assert.deepEqual(actual.sort((a,b)=>a.id-b.id),rows.map(r=>({id:r.id,name:r.name,price:money(r.price),unit:'/'+units[r.unit],hours:r.est_hours+' giờ'})));
  assert.equal(await page.evaluate("[...document.querySelectorAll('[data-price-table]')].every(t=>t.caption?.textContent && t.querySelectorAll('thead th[scope=col]').length===3 && t.getAttribute('aria-describedby')==='pricing-notes')"),true);
  assert.ok(await page.evaluate("document.querySelector('#pricing-notes').textContent.includes('chưa gồm thời gian lấy và giao')"));
 }finally{page?.close();await site.close();}
});

test('PRICING_READABILITY — aligned large prices, working shortcuts and booking, narrow and enlarged text without overflow',async()=>{
 const site=await localSite();let page;
 try{
  page=await browser();await page.send('Page.navigate',{url:site.base+'/bang-gia'});
  await until(()=>page.evaluate("Boolean(document.querySelector('#noi-dung h1'))"));
  assert.equal(await page.evaluate("document.querySelectorAll('[data-price-navigation] a[href^=\"#\"]').length"),6,'Six visible category shortcuts are required');
  fs.mkdirSync(dir,{recursive:true});await page.evaluate('document.fonts.ready');
  for(const width of [320,390,768,1440]){
   await page.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
   await page.evaluate('scrollTo(0,0);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
   assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'No sideways page scrolling at '+width);
   const prices=await page.evaluate("[...document.querySelectorAll('[data-price]')].map(e=>({font:parseFloat(getComputedStyle(e).fontSize),height:e.getBoundingClientRect().height,line:parseFloat(getComputedStyle(e).lineHeight)}))");
   assert.equal(prices.every(e=>e.font>=22&&e.height<e.line*1.8),true,'Prices are prominent and never split across lines at '+width+': '+JSON.stringify(prices));
   assert.equal(await page.evaluate("[...document.querySelectorAll('[data-price]')].every(e=>{const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect(),cell=e.closest('td').getBoundingClientRect(),unit=e.parentElement.querySelector('[data-unit]');return text.left>=cell.left-1&&text.right<=cell.right+1&&unit.getBoundingClientRect().height<parseFloat(getComputedStyle(unit).lineHeight)*1.8})"),true,'Amount and unit fit their own cell at '+width);
   assert.equal(await page.evaluate("(()=>{const edges=[...document.querySelectorAll('[data-price]')].map(e=>e.getBoundingClientRect().right);return Math.max(...edges)-Math.min(...edges)<2;})()"),true,'Prices share one scan line across all categories');
   if([390,1440].includes(width)){for(const full of [true,false]){const shot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:full});fs.writeFileSync(dir+'/pricing-'+(full?'':'first-')+width+'.png',Buffer.from(shot.data,'base64'));}}
  }
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
  await page.evaluate("document.querySelector('[data-price-navigation] a[href=\"#giat-gau-bong\"]').click()");
  await until(()=>page.evaluate("location.hash==='#giat-gau-bong' && document.querySelector('#giat-gau-bong').getBoundingClientRect().top>=70 && document.querySelector('#giat-gau-bong').getBoundingClientRect().top<350"));
  assert.equal(await page.evaluate("document.querySelector('#giat-gau-bong a[data-booking]').getAttribute('href')"),'/dat-lich?nhom=giat-gau-bong');
  await page.evaluate("document.querySelector('#giat-gau-bong a[data-booking]').click()");await until(()=>page.evaluate("location.pathname==='/dat-lich' && new URL(location.href).searchParams.get('nhom')==='giat-gau-bong'"));
  await page.send('Page.navigate',{url:site.base+'/bang-gia'});await until(()=>page.evaluate("Boolean(document.querySelector('[data-price-table]'))"));
  await page.evaluate("document.documentElement.style.fontSize='200%'");
  assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'200% text fits a narrow viewport');
  // Mutate this disposable catalog only: exercise long names, large prices and a new empty category.
  sql(site.db,"UPDATE services SET name='Dịch vụ chăm sóc quần áo với tên dài để kiểm tra khả năng xuống dòng rõ ràng',price=12345678 WHERE id=1;INSERT INTO service_categories(id,name,slug,description,sort_order) VALUES(99,'Nhóm đang chuẩn bị','dang-chuan-bi','',99);");
  await page.send('Page.navigate',{url:site.base+'/bang-gia'});await until(()=>page.evaluate("Boolean(document.querySelector('#dang-chuan-bi'))"));
  for(const width of [320,768]){await page.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'Long catalog content fits at '+width);assert.equal(await page.evaluate("(()=>{const name=document.querySelector('[data-service-id=\"1\"] [data-service-name]');const box=name.closest('th').getBoundingClientRect();const range=document.createRange();range.selectNodeContents(name);return [...range.getClientRects()].every(r=>r.left>=box.left-1&&r.right<=box.right+1)})()"),true,'Long names wrap within their own cell');}
  assert.equal(await page.evaluate("document.querySelector('[data-service-id=\"1\"] [data-price]').textContent"),money(12345678));
  assert.ok(await page.evaluate("document.querySelector('#dang-chuan-bi').textContent.includes('Giá đang cập nhật')"));
  assert.equal(await page.evaluate("document.querySelectorAll('#dang-chuan-bi a[data-booking]').length"),0);
 }finally{page?.close();await site.close();}
});

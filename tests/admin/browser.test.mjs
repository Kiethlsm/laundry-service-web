import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {browser,until} from '../browser/cdp.mjs';import {localSite} from '../browser/local-site.mjs';import {book,sql} from '../domain/helpers.mjs';
test('ADMIN_USABILITY_BROWSER — work groups, search, guided panels, contact links and mobile layout preserve order state',async()=>{
 const site=await localSite();let p;const dir='docs/verification/admin-overhaul';fs.mkdirSync(dir,{recursive:true});
 try{
 const order=book(site.db),revision=sql(site.db,"SELECT revision FROM orders WHERE id='"+order.order_id+"';");
 p=await browser();await p.send('Page.navigate',{url:site.base+'/admin/login'});await until(()=>p.evaluate("Boolean(document.querySelector('[name=email]'))"));
 await p.evaluate("(()=>{document.querySelector('[name=email]').value='demo.admin@example.invalid';document.querySelector('[name=password]').value='portfolio-demo-only';document.querySelector('form').requestSubmit();})()");
 await until(()=>p.evaluate("location.pathname==='/admin' && Boolean(document.querySelector('[data-group=new]'))"));
 await until(()=>p.evaluate("Object.keys(document.querySelector('[data-group=new]')).some(k=>k.startsWith('__reactProps'))"));
 assert.equal(await p.evaluate("document.querySelector('.admin-report').open"),false);
 assert.equal(await p.evaluate("document.querySelectorAll('.order-group-switcher button').length"),4);
 await p.evaluate("document.querySelector('[data-group=working]').click()");
 await until(()=>p.evaluate("document.querySelector('[data-group=working]').getAttribute('aria-pressed')==='true'"));
 assert.equal(await p.evaluate("Boolean(document.querySelector('.admin-empty'))"),true);
 await p.evaluate("document.querySelector('.admin-empty button').click()");
 await until(()=>p.evaluate("document.querySelectorAll('.admin-order-row').length>0"));
 await p.evaluate("(()=>{document.querySelector('[name=q]').value="+JSON.stringify(order.code)+";document.querySelector('form.admin-search').requestSubmit();})()");
 await until(()=>p.evaluate("location.search.includes('q="+order.code+"') && document.querySelectorAll('.admin-order-row').length===1"));
 assert.equal(await p.evaluate("document.querySelector('.admin-order-customer a').getAttribute('href')"),'tel:0000000000');
 await until(()=>p.evaluate("document.querySelector('.admin-order-row').checkVisibility()"));
 await p.evaluate('document.fonts.ready');
 for(const width of [390,1440]){await p.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});assert.equal(await p.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);const shot=await p.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(dir+'/orders-'+width+'.png',Buffer.from(shot.data,'base64'));}
 await p.send('Page.navigate',{url:site.base+'/admin/orders/'+order.order_id});
 await until(()=>p.evaluate("Boolean(document.querySelector('.admin-next-step')) && document.querySelector('.admin-next-step').checkVisibility()"));
 assert.ok(await p.evaluate("document.querySelector('.admin-next-step').innerText.includes('Nhận')"));
 await until(()=>p.evaluate("Object.keys(document.querySelector('.workspace-switcher button')).some(k=>k.startsWith('__reactProps'))"));
 await p.evaluate("document.querySelector('[aria-controls$=\"-quotes\"]').click()");
 await until(()=>p.evaluate("document.querySelector('[aria-controls$=\"-quotes\"]').getAttribute('aria-pressed')==='true'"));
 assert.equal(await p.evaluate("document.querySelector('[aria-label=\"Cân & báo giá\"]').hidden"),false);
 assert.equal(await p.evaluate("document.querySelector('[aria-label=\"Nhận & xử lý đồ\"]').hidden"),true);
 await p.evaluate("document.querySelector('.admin-next-step button').click()");
 await until(()=>p.evaluate("document.querySelector('[aria-controls$=\"-bags\"]').getAttribute('aria-pressed')==='true'"));
 assert.equal(await p.evaluate("document.querySelector('form[aria-label=\"Nhận túi đồ\"]').checkVisibility()"),true);
 await p.evaluate("document.querySelector('.admin-reference').open=true");assert.equal(await p.evaluate("document.querySelector('.order-detail').checkVisibility()"),true);await p.evaluate("document.querySelector('.admin-reference').open=false");
 await p.evaluate('document.fonts.ready');
 for(const width of [390,1440]){await p.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});assert.equal(await p.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);const shot=await p.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(dir+'/detail-'+width+'.png',Buffer.from(shot.data,'base64'));}
 assert.equal(sql(site.db,"SELECT revision FROM orders WHERE id='"+order.order_id+"';"),revision,'View switches never write order state');
 await p.send('Page.navigate',{url:site.base+'/'});await until(()=>p.evaluate("Boolean(document.querySelector('.shop-location')) && document.querySelector('.shop-location').checkVisibility()"));
 assert.equal(await p.evaluate("document.querySelector('.shop-phone').getAttribute('href')"),'tel:0903992813');
 assert.equal(await p.evaluate("new URL(document.querySelector('.shop-location').href).searchParams.get('query')"),'104/4G Nhất Chi Mai, phường Tân Bình, Thành phố Hồ Chí Minh');
 await until(()=>p.evaluate("document.readyState==='complete' && document.querySelector('.hero h1')?.checkVisibility()"));
 await p.evaluate('document.fonts.ready');
 assert.equal(await p.evaluate("getComputedStyle(document.querySelector('.shop-phone')).display"),'flex');
 assert.equal(await p.evaluate("getComputedStyle(document.querySelector('.shop-location')).display"),'flex');
 for(const width of [390,1440]){await p.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});await p.evaluate("document.querySelector('footer').scrollIntoView()");assert.equal(await p.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);const shot=await p.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(dir+'/footer-'+width+'.png',Buffer.from(shot.data,'base64'));}
 }finally{p?.close();await site.close();}
});

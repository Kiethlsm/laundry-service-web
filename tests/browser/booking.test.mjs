import test from 'node:test';
import assert from 'node:assert/strict';
import {browser,until} from './cdp.mjs';
import {localSite} from './local-site.mjs';
import {sql} from '../domain/helpers.mjs';
test('P02_BOOKING_UI — responsive keyboard consent and lost-response retry keeps one order',async()=>{
 const site=await localSite();let page;
 try{
  page=await browser();
  await page.send('Page.navigate',{url:site.base+'/dat-lich'});
  await until(()=>page.evaluate("Boolean(document.querySelector('input[name=consent]'))"));
  await page.send('Page.bringToFront');
  await page.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await until(async()=>{
   await page.evaluate("document.querySelector('#qty-1').focus();document.querySelector('#qty-1').select()");
   await page.send('Input.insertText',{text:'2'});
   return page.evaluate("document.querySelector('.summary-total').textContent.includes('50.000')");
  });
  for(const width of [360,390,768,1440]){
   await page.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
   assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`overflow at ${width}`);
  }
  await page.evaluate(`document.querySelector('[name=consent]').focus()`);
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  assert.equal(await page.evaluate("document.querySelector('[name=consent]').checked"),true);
  await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.equal(await page.evaluate("document.activeElement.name==='tolerance_consent'"),true);
  const pickup=new Date(Date.now()+86400000).toISOString().slice(0,16);
  await page.evaluate(`(()=>{const set=(sel,v)=>{const e=document.querySelector(sel);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));};set('#qty-1','2');set('[name=name]','ZZ TEST');set('[name=phone]','0000000000');set('[name=address]','Synthetic address');set('[name=pickup]',${JSON.stringify(pickup)});const native=window.fetch;let first=true;window.fetch=async(...args)=>{const r=await native(...args);if(first&&String(args[0]).includes('/api/orders')){first=false;throw new TypeError('PRIVATE_NETWORK');}return r;};})()`);
  await page.evaluate("document.querySelector('form.booking-layout').requestSubmit()");
  await until(()=>page.evaluate("Boolean(document.querySelector('.form-error'))"));
  assert.doesNotMatch(await page.evaluate("document.querySelector('.form-error').textContent"),/PRIVATE_NETWORK|fetch/);
  assert.equal(await page.evaluate("document.querySelector('[name=name]').value"),'ZZ TEST');
  await page.evaluate("document.querySelector('form.booking-layout').requestSubmit()");
  await until(()=>page.evaluate("Boolean(document.querySelector('.order-code'))"));
  assert.equal(sql(site.db,'SELECT count(*) FROM orders WHERE is_synthetic;'),'1');
  assert.equal(await page.evaluate("Boolean(document.querySelector('.bank-transfer'))"),false);
 }catch(error){console.error(error.stack);throw error;}finally{page?.close();await site.close();}
});

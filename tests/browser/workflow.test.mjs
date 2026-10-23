import test from 'node:test';import assert from 'node:assert/strict';
import {browser,until} from './cdp.mjs';import {localSite} from './local-site.mjs';import {book,sql} from '../domain/helpers.mjs';
test('P09_BROWSER_WORKFLOW — local cookie/session adapter and real admin actions reach delivered',async()=>{
 const site=await localSite();let page;
 try{
  const r=book(site.db);page=await browser();await page.send('Page.navigate',{url:site.base+'/admin/orders/'+r.order_id});
  await until(()=>page.evaluate("location.pathname==='/admin/login'&&Boolean(document.querySelector('[name=email]'))"));
  await page.send('Page.bringToFront');await page.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await page.evaluate(`(()=>{document.querySelector('[name=email]').value='demo.admin@example.invalid';document.querySelector('[name=password]').value='portfolio-demo-only';document.querySelector('[name=email]').closest('form').requestSubmit();})()`);
  await until(()=>page.evaluate("location.pathname==='/admin'"));
  await page.send('Page.navigate',{url:site.base+'/admin/orders/'+r.order_id});
  await until(()=>page.evaluate("Boolean(document.querySelector('form[aria-label=\"Nhận túi đồ\"]'))"));
  for(const width of [390,1440]){await page.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);}
  async function submit(label,values={}){
   const before=sql(site.db,`SELECT revision FROM orders WHERE id='${r.order_id}';`);
   await page.evaluate(`(()=>{const f=document.querySelector('form[aria-label='+JSON.stringify(${JSON.stringify(label)})+']');if(!f)throw new Error('Missing action form');if(f.closest('details'))f.closest('details').open=true;for(const [name,value]of Object.entries(${JSON.stringify(values)})){const e=f.elements.namedItem(name);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));}for(const c of f.querySelectorAll('input[type=checkbox]'))c.checked=true;f.requestSubmit();})()`);
   await until(()=>sql(site.db,`SELECT revision FROM orders WHERE id='${r.order_id}';`)!==before);
   await until(()=>page.evaluate(`document.querySelector('input[name=revision]')?.value===${JSON.stringify(String(Number(before)+1))}`));
  }
  await submit('Nhận túi đồ',{'bag_tag:0':'BAG-BROWSER','bag_count:0':'3','bag_condition:0':'Synthetic intake condition','flag_tag:0':'ITEM-BROWSER','flag_description:0':'Flagged jacket','flag_condition:0':'Synthetic pre-existing mark'});
  await submit('Phát hành phiên bản mới',{['quantity:'+sql(site.db,`SELECT min(id) FROM order_items WHERE order_id='${r.order_id}';`)]:'3'});
  await submit('Xác minh bằng chứng mô phỏng',{customer_message:'ZZ TEST customer-originated acceptance, simulated'});
  await submit('Lưu cân thực tế');await submit('Bắt đầu xử lý');await submit('Hoàn tất kiểm tra chất lượng');
  await submit('Giao đồ và thu tiền',{recipient_evidence:'ZZ TEST simulated recipient acknowledgement'});
  assert.equal(sql(site.db,`SELECT status FROM orders WHERE id='${r.order_id}';`),'delivered');
  assert.equal(sql(site.db,`SELECT sum(signed_effect) FROM payment_transactions WHERE order_id='${r.order_id}';`),'155000');
 }finally{page?.close();await site.close();}
});

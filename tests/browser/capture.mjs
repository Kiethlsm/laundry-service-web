import fs from 'node:fs';
import {localSite} from './local-site.mjs';
import {browser,until} from './cdp.mjs';
import {ready} from '../domain/helpers.mjs';
const site=await localSite();let page;
try{
 const order=ready(site.db);page=await browser();
 await page.send('Page.navigate',{url:site.base+'/admin/login'});
 await until(()=>page.evaluate("Boolean(document.querySelector('[name=email]'))"));
 await page.evaluate("(()=>{document.querySelector('[name=email]').value='demo.admin@example.invalid';document.querySelector('[name=password]').value='portfolio-demo-only';document.querySelector('form').requestSubmit();})()");
 await until(()=>page.evaluate("location.pathname==='/admin'"));
 await page.send('Page.navigate',{url:site.base+'/admin/orders/'+order.order_id});
 await until(()=>page.evaluate("Boolean(document.querySelector('.demo-workspace'))"));
 for(const width of [1440,390]){
  await page.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  const shot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  fs.writeFileSync(`docs/verification/continuous/P09/admin-${width}.png`,Buffer.from(shot.data,'base64'));
 }
 console.log('Captured synthetic local admin at 1440 and 390px');
}finally{page?.close();await site.close();}

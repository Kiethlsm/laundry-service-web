import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {browser,until} from './cdp.mjs';import {localSite} from './local-site.mjs';import {sql} from '../domain/helpers.mjs';

test('QR_RECIPIENT_ASSET — verified local PNG is served unchanged without an image optimizer',()=>{
 const guide=fs.readFileSync('docs/verification/manual-qr/README.md','utf8');
 assert.match(guide,/1089/);assert.match(guide,/manual/i);
 const asset=fs.readFileSync('public/payments/techcombank-qr.png');
 assert.equal(asset.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(asset.readUInt32BE(16),1228);assert.equal(asset.readUInt32BE(20),1281);
 const provenance=JSON.parse(fs.readFileSync('docs/verification/manual-qr/asset.json','utf8'));
 assert.equal(createHash('sha256').update(asset).digest('hex'),provenance.sha256);
 assert.equal(provenance.moduleDifferences,0);assert.equal(provenance.modulesCompared,1089);
});

test('QR_BANK_BOOKING — cash isolation, static QR/memo/copy errors and no automatic money posting',async()=>{
 const site=await localSite();let page;
 try{
  page=await browser();await page.send('Page.navigate',{url:site.base+'/dat-lich'});
  await until(()=>page.evaluate("Boolean(document.querySelector('#qty-1'))"));
  await page.send('Page.bringToFront');await page.send('Emulation.setFocusEmulationEnabled',{enabled:true});
  await until(async()=>{await page.evaluate("document.querySelector('#qty-1').focus();document.querySelector('#qty-1').select()");await page.send('Input.insertText',{text:'2'});return page.evaluate("document.querySelector('.summary-total').textContent.includes('50.000')");});
  assert.equal(await page.evaluate("Boolean(document.querySelector('.bank-transfer'))"),false);
  await page.evaluate("document.querySelector('[name=payment][value=bank_transfer]').click()");
  await until(()=>page.evaluate("Boolean(document.querySelector('.bank-transfer'))"),3000);
  assert.match(await page.evaluate("document.querySelector('.bank-transfer').textContent"),/TECHCOMBANK|Techcombank/);
  assert.equal(await page.evaluate("document.querySelector('.bank-transfer img').getAttribute('src')"),'/payments/techcombank-qr.png');
  assert.equal(await page.evaluate("document.querySelector('.bank-transfer img').getAttribute('srcset')"),null);
  for(const width of [360,390,768,1440]){await page.send('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:width<768});assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);}
  await page.evaluate("window.qrCopied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.qrCopied.push(value)}});document.querySelector('[data-copy=account]').click()");
  await until(()=>page.evaluate("window.qrCopied.length===1"));assert.deepEqual(await page.evaluate('window.qrCopied'),['38606688']);
  await page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('PRIVATE_CLIPBOARD')}}});document.querySelector('[data-copy=account]').click()");
  await until(()=>page.evaluate("document.querySelector('.bank-transfer [role=status]').textContent.includes('Chưa sao chép')"));
  assert.doesNotMatch(await page.evaluate("document.querySelector('.bank-transfer').textContent"),/PRIVATE_CLIPBOARD/);
  await page.evaluate("document.querySelector('[name=payment][value=cash]').click()");await until(()=>page.evaluate("!document.querySelector('.bank-transfer')"));
  await page.evaluate("document.querySelector('[name=payment][value=bank_transfer]').click()");await until(()=>page.evaluate("Boolean(document.querySelector('.bank-transfer'))"));
  const pickup=new Date(Date.now()+86400000).toISOString().slice(0,16);
  await page.evaluate(`(()=>{for(const [name,value]of Object.entries({name:'ZZ TEST',phone:'0000000000',address:'Synthetic address',pickup:${JSON.stringify(pickup)}})){document.querySelector('[name='+name+']').value=value;}document.querySelector('[name=consent]').checked=true;document.querySelector('form.booking-layout').requestSubmit();})()`);
  await until(()=>page.evaluate("Boolean(document.querySelector('.order-code'))"));
  const code=await page.evaluate("document.querySelector('.order-code').textContent");
  assert.ok(await page.evaluate(`document.querySelector('.bank-transfer').textContent.includes(${JSON.stringify('SACHSACH ')}+${JSON.stringify(code)})`));
  assert.match(await page.evaluate("document.querySelector('.bank-transfer').textContent"),/Tạm tính/);
  assert.match(await page.evaluate("document.querySelector('.bank-transfer').textContent"),/QR tĩnh/);
  assert.match(await page.evaluate("document.querySelector('.bank-transfer').textContent"),/không chuyển tiền thật/);
  await page.evaluate("window.qrCopied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>window.qrCopied.push(value)}});document.querySelector('[data-copy=memo]').click()");await until(()=>page.evaluate('window.qrCopied.length===1'));assert.deepEqual(await page.evaluate('window.qrCopied'),['SACHSACH '+code]);
  assert.equal(await page.evaluate("document.querySelector('.bank-transfer a[download]').getAttribute('href')"),'/payments/techcombank-qr.png');
  const img=await fetch(site.base+'/payments/techcombank-qr.png');assert.equal(img.status,200);assert.deepEqual(Buffer.from(await img.arrayBuffer()),fs.readFileSync('public/payments/techcombank-qr.png'));
  assert.equal(sql(site.db,'SELECT count(*) FROM payment_transactions;'),'0');assert.equal(sql(site.db,"SELECT count(*) FROM orders WHERE is_synthetic AND payment_method='bank_transfer' AND status='pending';"),'1');
  for(const width of [390,1440]){await page.send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<768});assert.equal(await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);const shot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(`docs/verification/manual-qr/booking-${width}.png`,Buffer.from(shot.data,'base64'));}
  const id=sql(site.db,"SELECT id FROM orders WHERE is_synthetic AND payment_method='bank_transfer';");
  await page.send('Page.navigate',{url:site.base+'/admin/login'});await until(()=>page.evaluate("Boolean(document.querySelector('[name=email]'))"));
  await page.evaluate("(()=>{document.querySelector('[name=email]').value='demo.admin@example.invalid';document.querySelector('[name=password]').value='portfolio-demo-only';document.querySelector('form').requestSubmit();})()");await until(()=>page.evaluate("location.pathname==='/admin'"));
  await page.send('Page.navigate',{url:site.base+'/admin/orders/'+id});await until(()=>page.evaluate("Boolean(document.querySelector('.bank-transfer-admin'))"));
  await page.evaluate("document.querySelector('.bank-transfer-admin').open=true");
  assert.equal(await page.evaluate("document.querySelector('.bank-transfer-admin [data-copy=memo]')!==null"),true);
  assert.ok(await page.evaluate(`document.querySelector('.bank-transfer-admin').textContent.includes(${JSON.stringify('SACHSACH ')}+${JSON.stringify(code)})`));
  assert.equal(sql(site.db,'SELECT count(*) FROM payment_transactions;'),'0');
 }finally{page?.close();await site.close();}
});

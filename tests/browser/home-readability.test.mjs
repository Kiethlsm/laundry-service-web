import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, until } from './cdp.mjs';
import { localSite } from './local-site.mjs';

test('HOME_READABILITY — readable controls, early contact, discoverable prices and six working selections', async () => {
 const site = await localSite();
 let p;
 const dir = 'docs/verification/home-readability';
 fs.mkdirSync(dir, { recursive: true });
 const observations = [];
 try {
  p = await browser();
  await p.send('Page.navigate', { url: site.base + '/' });
  await until(() => p.evaluate("document.querySelectorAll('.dial-choices button').length === 6 && Object.keys(document.querySelector('.dial-choices button')).some(k=>k.startsWith('__reactProps'))"));
  await p.evaluate('document.fonts.ready');
  for (const width of [320, 390, 768, 1440]) {
   const height = width < 768 ? 667 : 900;
   await p.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
   await p.evaluate("scrollTo({top:0,behavior:'instant'});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
   const state = await p.evaluate(`(() => {
    const font = e => parseFloat(getComputedStyle(e).fontSize);
    const controls = [...document.querySelectorAll('.dial-choices button')];
    const links = [...document.querySelectorAll('.service-line')];
    const locality = document.querySelector('.landing-locality');
    return {
     overflow: document.documentElement.scrollWidth > innerWidth,
     controls: controls.map(e => ({font:font(e),fits:e.scrollWidth<=e.clientWidth&&e.scrollHeight<=e.clientHeight,height:parseFloat(getComputedStyle(e).minHeight)})),
     detailFonts: [...document.querySelectorAll('.dial small,.panel-book')].map(font),
     localityBottom:locality.getBoundingClientRect().bottom,
     call:locality.querySelector('a[href^="tel:"]').getAttribute('href'),
     map:locality.querySelector('a[target="_blank"]').href,
     prices:links.map(e=>({href:e.getAttribute('href'),arrow:e.querySelector(':scope > svg').checkVisibility()})),
     footerFonts:[...document.querySelectorAll('.footer-grid > div > a')].map(font),
     instructionsBeforeControls: Boolean(document.querySelector('.landing-machine > p').compareDocumentPosition(document.querySelector('.washer-stage')) & Node.DOCUMENT_POSITION_FOLLOWING),
     priceQualification:document.querySelector('.landing-machine > p').textContent,
     duplicateContactStrip:Boolean(document.querySelector('.landing-contact')),
    };
   })()`);
   observations.push({ width, ...state });
   assert.equal(state.overflow, false, `${width}px page overflow`);
   assert.ok(state.controls.every(c => c.font >= 14 && c.fits && c.height >= 44), `${width}px readable, unclipped controls`);
   assert.ok(state.detailFonts.every(v => v >= 14));
   assert.ok(state.localityBottom < height, `${width}px contact visible before scrolling`);
   assert.equal(state.call, 'tel:0903992813');
   assert.ok(state.map.startsWith('https://'));
   assert.equal(state.prices.length, 6);
   assert.ok(state.prices.every(v => v.arrow && v.href.startsWith('/bang-gia#')));
   assert.ok(state.footerFonts.every(v => v >= 14));
   assert.equal(state.instructionsBeforeControls, true);
   assert.match(state.priceQualification, /giá tham khảo/);
   assert.match(state.priceQualification, /xác nhận chi phí sau khi nhận đồ/);
   assert.equal(state.duplicateContactStrip, false);
   for (let i = 0; i < 6; i++) {
    const selected = await p.evaluate(`(() => { const b=document.querySelectorAll('.dial-choices button')[${i}];b.click();return b.textContent; })()`);
    await until(() => p.evaluate(`document.querySelectorAll('.dial-choices button')[${i}].getAttribute('aria-pressed') === 'true'`));
    assert.equal(await p.evaluate("document.querySelectorAll('.dial-choices button[aria-pressed=true]').length"), 1);
    assert.equal(await p.evaluate("document.querySelector('.dial h2').textContent"), selected);
    assert.ok(await p.evaluate("document.querySelector('.panel-book').getAttribute('href').startsWith('/dat-lich?nhom=')"));
   }
   await p.evaluate("document.querySelectorAll('.dial-choices button')[0].focus()");
   // Enter keyboard modality with a real Tab; programmatic focus alone can
   // correctly suppress :focus-visible after preceding pointer interactions.
   await p.send('Input.dispatchKeyEvent', { type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9 });
   await p.send('Input.dispatchKeyEvent', { type:'keyUp', key:'Tab', code:'Tab', windowsVirtualKeyCode:9 });
   await until(() => p.evaluate("document.activeElement === document.querySelectorAll('.dial-choices button')[1]"));
   assert.equal(await p.evaluate("getComputedStyle(document.activeElement).outlineStyle !== 'none' && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 2"), true);
   await p.send('Input.dispatchKeyEvent', { type:'keyDown', key:' ', code:'Space', windowsVirtualKeyCode:32 });
   await p.send('Input.dispatchKeyEvent', { type:'keyUp', key:' ', code:'Space', windowsVirtualKeyCode:32 });
   await until(() => p.evaluate("document.querySelectorAll('.dial-choices button')[1].getAttribute('aria-pressed') === 'true'"));
   if ([390, 1440].includes(width)) {
    await p.evaluate("document.querySelector('.dial-choices button').click();scrollTo({top:0,behavior:'instant'})");
    const shot = await p.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(`${dir}/home-${width}.png`, Buffer.from(shot.data, 'base64'));
   }
  }
 } finally {
  fs.writeFileSync(`${dir}/measurements.json`, JSON.stringify(observations, null, 2));
  p?.close();
  await site.close();
 }
});

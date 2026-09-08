// Browser acceptance checks use isolated IPC fixtures, never the network driver.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
async function checkContrast(page) {
 const ratios = await page.evaluate(() => {
  const rgb = value => value.match(/[\d.]+/g).slice(0,3).map(Number);
  const luminance = value => rgb(value).map(v => {v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  return ['.profile-description','.chart-caption','.nav-label','.power-switch'].map(selector=>{
   const el=document.querySelector(selector); let parent=el;
   while(parent && getComputedStyle(parent).backgroundColor==='rgba(0, 0, 0, 0)') parent=parent.parentElement;
   const a=luminance(getComputedStyle(el).color), b=luminance(getComputedStyle(parent).backgroundColor);
   return {selector,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });
 });
 for(const row of ratios) assert.ok(row.ratio>=4.5,JSON.stringify(row));
 console.log('Text contrast:',ratios);
}
const fixture = `
import { mockIPC, mockWindows } from '/node_modules/@tauri-apps/api/mocks.js';
mockWindows('main');
window.fixture = { running: false, fail: false, starts: 0, probes: 0 };
mockIPC(async (cmd, args) => {
 const f = window.fixture;
 if (cmd === 'get_status') { if (f.fail) throw Error('Unavailable'); return {running:f.running,profile_id:'universal',packets_seen:120,packets_touched:32,passthrough:88,uptime_sec:f.running?12:0}; }
 if (cmd === 'list_profiles') return [{id:'universal',name:'Universal',description:'TLS ve HTTP için genel bağlantı profili.',builtin:true,steps:[{type:'fragment_http'}]}];
 if (cmd === 'get_blacklist') return ['example.com','example.org','example.net'];
 if (cmd === 'check_dns_health') return {poisoned:false,secure:true};
 if (cmd === 'check_compatibility') return {av_detected:[],vpn_detected:[],legacy_services:[],windivert_ok:true};
 if (cmd === 'start_engine') { f.starts++; await new Promise(r=>setTimeout(r,300)); f.running=true; return; }
 if (cmd === 'stop_engine') { f.running=false; return; }
 if (cmd === 'probe_target') { f.probes++; return {host:args.req.host,result:'open',latency_ms:24}; }
 if (cmd.includes('is_maximized')) return false;
 throw Error('Unimplemented fixture: '+cmd);
}, {shouldMockEvents:true});
`;

(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(() => { localStorage.setItem('anticore_onboarded','true'); localStorage.setItem('anticore_last_profile','deleted'); localStorage.setItem('anticore_language','tr'); localStorage.setItem('anticore_theme_mode','obsidian'); });
  await page.route('**/src/main.tsx*',async route=> { const response=await route.fetch(); await route.fulfill({response,body:fixture+'\n'+await response.text()}); });
  await page.goto('http://127.0.0.1:1420/');
  const start=page.getByRole('button',{name:'Bağlantıyı başlat',exact:true});
  await start.waitFor();
  assert.equal(await page.evaluate(()=>!!window.fixture),true,'IPC fixture must load before the application');
  await page.waitForFunction(()=>document.querySelector('#connection-profile')?.value==='universal');
  assert.equal(await start.isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.fixture.probes),0);
  await page.evaluate(()=>document.fonts.ready);
  await start.focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#connection-profile').evaluate(el=>el===document.activeElement),true);
  await page.locator('.workspace-main').evaluate(el=>el.scrollTop=0);
  await checkContrast(page);
  await page.screenshot({path:path.join(process.env.UI_OUTPUT_DIR,'workspace-dark.png')});
  await start.click();
  assert.equal(await page.getByRole('button',{name:'İşlem sürüyor…',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Motoru durdur',exact:true}).waitFor();
  assert.equal(await page.locator('#connection-profile').isDisabled(),true);
  assert.equal(await page.evaluate(()=>window.fixture.starts),1);
  await page.getByRole('button',{name:'Hedefleri test et',exact:true}).click();
  await page.getByText('TLS yanıtı alındı',{exact:true}).first().waitFor();
  assert.equal(await page.evaluate(()=>window.fixture.probes),3);
  await page.getByRole('button',{name:'Motoru durdur',exact:true}).click();
  await start.waitFor();
  assert.equal(await page.getByText('TLS yanıtı alındı',{exact:true}).count(),0);
  for (const width of [1080,768,390]) {
   await page.setViewportSize({width,height:844});
   await page.locator('.workspace-main').evaluate(el=>el.scrollTop=0);
   assert.equal(await page.locator('.workspace-main').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Horizontal overflow at '+width);
   await page.screenshot({path:path.join(process.env.UI_OUTPUT_DIR,'workspace-'+width+'.png')});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>{localStorage.setItem('anticore_theme_mode','titanium');});
  // Change the real theme using its control until the light theme is reached.
  for(let i=0;i<9 && !(await page.locator('html').evaluate(el=>el.classList.contains('light')));i++) await page.getByTitle(/^Tema:/).click();
  assert.equal(await page.locator('html').evaluate(el=>el.classList.contains('light')),true);
  await checkContrast(page);
  await page.locator('.workspace-main').evaluate(el=>el.scrollTop=0);
  await page.screenshot({path:path.join(process.env.UI_OUTPUT_DIR,'workspace-light.png')});
  await page.evaluate(()=>window.fixture.fail=true);
  await page.getByRole('heading',{name:'Durum alınamıyor.'}).waitFor();
  assert.equal(await start.isDisabled(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: profile fallback, no automatic probes, start lock, profile lock, target test, stale-result reset, 3 widths, light theme, unknown state; no browser exceptions.');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

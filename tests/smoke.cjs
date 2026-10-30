// Run after python3 build.py; requires Playwright and a Chromium browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8000';
(async () => {
  const browser = await chromium.launch({headless:true, ...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
  const errors = [];
  try {
    // Instrument only the test response; no debug interface ships to players.
    const context = await browser.newContext({serviceWorkers:'block'});
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install();
    await page.route('**/game.js', async route => {
      const response = await route.fetch();
      const source = await response.text();
      const hook = `window.gameTest={get state(){return {phase,elapsed,players:players.length,offenseTeam,activeDefense,conversion,pending:animationFrame!==null};},touchdown:beginPointChoice,defend(){offenseTeam="red";defenseTeam="blue";setup();}};`;
      await route.fulfill({response,body:source.replace('updateDownDisplay();setup();})();', 'updateDownDisplay();setup();'+hook+'})();')});
    });
    await page.goto(base);
    assert.equal(await page.title(), "Jameson's Football");
    assert.equal((await page.evaluate(()=>gameTest.state)).players,22);
    assert.equal(await page.locator('.helmet-svg').count(),2);
    for (const play of ['run','short','deep']) {
      await page.locator('#reset').click();
      await page.locator(`[data-play="${play}"]`).click();
      assert.equal(await page.locator('#play').inputValue(),play);
      await page.locator('#snap').click();
      assert.equal((await page.evaluate(()=>gameTest.state)).phase,'live');
      await page.clock.runFor(22000);
      assert.notEqual((await page.evaluate(()=>gameTest.state)).phase,'live');
    }
    for(const defense of ['man','zone','blitz']){
      await page.locator('#reset').click();
      await page.evaluate(()=>gameTest.defend());
      assert.equal(await page.locator('#defenseControl').isVisible(),true);
      assert.equal(await page.locator('#offenseControl').isVisible(),false);
      assert.equal(await page.locator('#defensePlay').isVisible(),false);
      await page.locator(`[data-defense="${defense}"]`).click();
      assert.equal(await page.locator('#defensePlay').inputValue(),defense);
      assert.equal(await page.locator('#defenseControl [aria-pressed="true"]').count(),1);
      assert.equal(await page.locator(`[data-defense="${defense}"]`).getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('[data-play="deep"]').getAttribute('aria-pressed'),'true');
      await page.locator('#snap').click();
      assert.equal((await page.evaluate(()=>gameTest.state)).activeDefense,defense);
    }
    for (const eight of [false,true]) {
      await page.locator('#reset').click();
      await page.evaluate(()=>gameTest.touchdown('blue'));
      await page.clock.runFor(1000);
      assert.equal(await page.locator('#blueScore').textContent(),'6');
      await page.locator('#celebrationClose').click();
      await page.locator(eight?'#tryEight':'#takeSeven').click();
      assert.equal((await page.evaluate(()=>gameTest.state)).phase,eight?'ready':'kickoff');
      assert.equal(await page.locator('#blueScore').textContent(),eight?'6':'7');
      await page.locator('#snap').click();
      await page.clock.runFor(20000);
    }
    await page.locator('#reset').click();
    await page.locator('[data-play="run"]').click();
    await page.locator('#snap').click();
    await page.clock.runFor(1000);
    await page.locator('#reset').click();
    await page.locator('[data-play="run"]').click();
    await page.locator('#snap').click();
    await page.clock.runFor(1000);
    const state=await page.evaluate(()=>gameTest.state);
    assert(state.elapsed>.75 && state.elapsed<.85,`animation elapsed ${state.elapsed}`);
    assert.deepEqual(errors,[]);
    fs.mkdirSync('test-results',{recursive:true});
    await page.locator('#reset').click();
    await page.screenshot({path:'test-results/desktop.png',fullPage:true});
    await context.close();
    // Test the real, unmodified app with service worker, mobile touch layout, offline reload.
    const mobile = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const phone=await mobile.newPage();
    phone.on('pageerror',e=>errors.push(e.message));
    await phone.goto(base);
    await phone.waitForFunction(()=>navigator.serviceWorker.controller!==null, {timeout:15000});
    await phone.waitForFunction(()=>navigator.serviceWorker.controller!==null);
    const manifest=await phone.evaluate(async()=>await (await fetch('./manifest.webmanifest')).json());
    assert.equal(manifest.display,'standalone');
    for (const icon of [...manifest.icons,{src:'./icons/icon-180.png',sizes:'180x180'}]) {
      const dimensions=await phone.evaluate(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(`${i.width}x${i.height}`);i.onerror=reject;i.src=src;}),icon.src);
      assert.equal(dimensions,icon.sizes);
    }
    const overflow=await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(overflow,false,'mobile page should fit viewport');
    const headerOverlap=await phone.evaluate(()=>{
      const a=document.querySelector('header h1').getBoundingClientRect();
      const b=document.querySelector('.field-scoreboard').getBoundingClientRect();
      const c=document.querySelector('#reset').getBoundingClientRect();
      const overlaps=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;
      return overlaps(a,b)||overlaps(a,c)||overlaps(b,c);
    });
    assert.equal(headerOverlap,false,'mobile title, scoreboard and reset must not overlap');
    await phone.screenshot({path:'test-results/mobile.png',fullPage:true});
    await mobile.setOffline(true);
    await phone.reload();
    await phone.locator('[data-play="short"]').tap();
    await phone.locator('#snap').tap();
    await phone.waitForTimeout(1500);
    assert.equal(await phone.locator('#snap').isDisabled(),true);
    assert.deepEqual(errors,[]);
    await mobile.close();
    console.log('PASS: run/short/deep plays, touchdowns, point choices, kickoff, reset animation, helmets, mobile layout, icons, service worker and offline gameplay; no page errors.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
process.env.LD_LIBRARY_PATH='/tmp/lib'
const b=await puppeteer.launch({headless:true,executablePath:await chromium.executablePath(),args:[...chromium.args,'--no-sandbox'],defaultViewport:null})
const pg=await b.newPage(); await pg.setViewport({width:390,height:844,deviceScaleFactor:2})
await pg.goto('http://localhost:5173/',{waitUntil:'networkidle0'})
for(const r of ['dash','bill','items','parties','reports','bills']){await pg.evaluate(rt=>window.__go(rt),r);await new Promise(z=>setTimeout(z,500));await pg.screenshot({path:`shots/final-${r}.png`,fullPage:true})}
// bill with an item line: focus search, type, Enter
await pg.evaluate(()=>window.__go('bill'));await new Promise(z=>setTimeout(z,300))
await pg.click('.bill-grid input.inp');await pg.type('.bill-grid input.inp','wheat',{delay:40})
await pg.keyboard.press('Enter');await new Promise(z=>setTimeout(z,500))
await pg.screenshot({path:'shots/final-bill-line.png',fullPage:true})
await b.close();console.log('shots ✓')

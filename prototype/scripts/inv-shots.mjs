import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
process.env.LD_LIBRARY_PATH='/tmp/lib'
const W=+(process.env.W||900)
const b=await puppeteer.launch({headless:true,executablePath:await chromium.executablePath(),args:[...chromium.args,'--no-sandbox'],defaultViewport:null})
const pg=await b.newPage(); await pg.setViewport({width:W,height:900,deviceScaleFactor:2})
await pg.goto('http://localhost:5173/',{waitUntil:'networkidle0'})
await pg.evaluate(()=>window.__go('bill')); await new Promise(z=>setTimeout(z,500))
// open first invoice preview (👁)
const eye=await pg.$('.bills .eye, .cardtable .eye, table .eye')
if(!eye){console.log('no eye found');process.exit(1)}
await eye.click(); await new Promise(z=>setTimeout(z,600))
const sheet=await pg.$('.print-wrap')
await sheet.screenshot({path:`shots/inv-a4-${W}.png`})
// overflow inside modal
console.log(await pg.evaluate(()=>{const vw=document.documentElement.clientWidth;const bad=[...document.querySelectorAll('.print-root *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>vw+1&&r.width>0&&getComputedStyle(e).display!=='none'}).slice(0,6).map(e=>e.tagName+'.'+(typeof e.className==='string'?e.className:'')+' w='+Math.round(e.getBoundingClientRect().width));return 'OVERFLOW:'+bad.length+(bad.length?' | '+bad.join(' ; '):'')}))
for(const [chip,name] of [['A5','a5'],['80mm','th'],['240mm','t240']]){
  const els=await pg.$$('.print-bar .chipbtn')
  for(const el of els){const t=await el.evaluate(x=>x.textContent); if(t.trim()===chip){await el.click();break}}
  await new Promise(z=>setTimeout(z,450))
  await (await pg.$('.print-wrap')).screenshot({path:`shots/inv-${name}-${W}.png`})
}
// receipt via payments page
await pg.keyboard.press('Escape'); await pg.evaluate(()=>window.__go && document.querySelectorAll('.print-bar .btn.sm').length)
await b.close(); console.log('inv shots ✓')

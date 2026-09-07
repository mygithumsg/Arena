import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
process.env.LD_LIBRARY_PATH = '/tmp/lib'
const b = await puppeteer.launch({headless:true, executablePath: await chromium.executablePath(), args:[...chromium.args,'--no-sandbox'], defaultViewport:null})
const pg = await b.newPage(); await pg.setViewport({width:390,height:844,deviceScaleFactor:1})
await pg.goto('http://localhost:5173/',{waitUntil:'networkidle0'})
await pg.evaluate(()=>window.__go('bill')); await new Promise(z=>setTimeout(z,450))
console.log(await pg.evaluate(()=>{
  const out=[]
  const el=document.querySelector('.billform select') || document.querySelector('.ghost-box')
  let e=el
  while(e && e!==document.documentElement){
    const cs=getComputedStyle(e); const r=e.getBoundingClientRect()
    out.push(`${e.tagName.toLowerCase()}.${(e.className||'').toString().split(' ').join('.')} | w=${Math.round(r.width)} L=${Math.round(r.left)} R=${Math.round(r.right)} | disp=${cs.display} minw=${cs.minWidth} maxw=${cs.maxWidth} gtc=${cs.gridTemplateColumns.slice(0,60)} pad=${cs.paddingLeft}/${cs.paddingRight} flexb=${cs.flexBasis}`)
    e=e.parentElement
  }
  const vw=document.documentElement.clientWidth
  const wide=[...document.querySelectorAll('body *')].filter(x=>x.getBoundingClientRect().right>vw+1).sort((a,c)=>a.getBoundingClientRect().width-c.getBoundingClientRect().width)
  const deepest=wide.find(x=>!x.querySelector('*:not(small):not(b)'))||wide[0]
  out.push('--- FIRST-OVERFLOWING-LEAF: '+deepest.tagName+'.'+deepest.className)
  e=deepest
  while(e && e!==document.documentElement){ const cs=getComputedStyle(e); const r=e.getBoundingClientRect()
    out.push(`${e.tagName.toLowerCase()}.${(e.className||'').toString().split(' ').join('.')} | w=${Math.round(r.width)} R=${Math.round(r.right)} | disp=${cs.display} minw=${cs.minWidth} table-layout=${cs.tableLayout||''}`)
    e=e.parentElement }
  return out.join('\n')
}))
await b.close()

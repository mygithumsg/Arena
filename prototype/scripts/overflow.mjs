import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
process.env.LD_LIBRARY_PATH = '/tmp/lib' + (process.env.LD_LIBRARY_PATH?':'+process.env.LD_LIBRARY_PATH:'')
import fs from 'fs'
const W = +(process.env.W||390), URL = process.env.URL||'http://localhost:5173/'
fs.mkdirSync('shots',{recursive:true})
const routes = (process.env.ROUTES||'dash,items,bill,bills,parties,reports,payments').split(',')
const b = await puppeteer.launch({headless:true, executablePath: await chromium.executablePath(), args:[...chromium.args,'--no-sandbox'], defaultViewport:null})
const pg = await b.newPage()
await pg.setViewport({width:W, height:844, deviceScaleFactor:2})
await pg.goto(URL,{waitUntil:'networkidle0'})
for (const r of routes){
  await pg.evaluate(rt=>window.__go(rt), r); await new Promise(z=>setTimeout(z,450))
  const rep = await pg.evaluate(vw=>{
    const bad=[]
    const els=[...document.querySelectorAll('body *')]
    const over=new Map()
    for(const el of els){
      const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden')continue
      const q=el.getBoundingClientRect(); if(!q.width&&!q.height)continue
      if(q.right>vw+1){ over.set(el,q) }
    }
    for(const [el,q] of over){
      let leaf=true
      for(const c of el.children){ if(over.has(c)){leaf=false;break} }
      if(!leaf)continue
      const cls=(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).join('.'):'')
      bad.push({tag:el.tagName.toLowerCase()+cls, right:Math.round(q.right), w:Math.round(q.width), txt:(el.textContent||'').trim().slice(0,42)})
    }
    return {scrollW:document.documentElement.scrollWidth, vw, bad}
  }, W)
  const extra = rep.scrollW>W+1?`PAGE-OVERFLOW scrollW=${rep.scrollW}`:''
  console.log(`\n== ${r} @${W}px ${extra}`)
  for(const x of rep.bad.slice(0,14)) console.log(`   ${x.tag} right=${x.right} w=${x.w} "${x.txt}"`)
  await pg.screenshot({path:`shots/${r}-${W}.png`, fullPage:true})
}
await b.close()

import fs from 'node:fs/promises'
import { chromium } from '/Users/gatsby/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs'

// Capture only the real game's 3D canvas in an isolated browser profile.
const out='output/playwright/promo-15s-en'
const browser=await chromium.launch({headless:true,executablePath:'/Users/gatsby/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--use-angle=metal']})
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1})
const errors=[];page.on('pageerror',e=>errors.push(e.message))
try{
 await page.goto('http://127.0.0.1:5182/',{waitUntil:'networkidle'})
 console.log((await page.locator('body').ariaSnapshot()).slice(0,1200))
 await page.getByRole('button',{name:/訓練を(開始|再開)する/}).click()
 await page.waitForTimeout(1000)
 const sources=[['eva','overview'],['robotics','arm'],['t38','jet'],['lunar','surface'],['emergency','hatch']]
 for(const [id,focus] of sources){
  await fs.mkdir(`${out}/${id}`,{recursive:true})
  await page.evaluate(async({id,focus})=>{
   const {useGame}=await import('/src/game/store.ts')
   const {usePractice}=await import('/src/minigames/practice.ts')
   usePractice.getState().set({event:id==='emergency'?'fire-cabin':'',active:null})
   useGame.getState().updateSettings({quality:'ultra',audio:false,particleMotion:true})
   useGame.setState({introSeen:true,debugMode:false,screen:{name:'module',id,phase:'quiz'},focus})
  },{id,focus})
  await page.waitForTimeout(1900)
  await page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.particleCount)>0)
  await page.evaluate(async()=>{const {useUi}=await import('/src/ui/uiStore.ts');useUi.getState().setViewShift(0,0)})
  await page.waitForTimeout(1600)
  for(let frame=0;frame<27;frame++){
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)))
   const data=await page.evaluate(async()=>{
    const {captureScene}=await import('/src/engine/capture.ts')
    return captureScene()
   })
   if(!data?.startsWith('data:image/png;base64,'))throw new Error(`Capture missing: ${id}`)
   await fs.writeFile(`${out}/${id}/${String(frame).padStart(2,'0')}.png`,Buffer.from(data.split(',')[1],'base64'))
  }
  console.log(`Captured ${id}: 27 moving source frames`)
 }
 await fs.writeFile(`${out}/capture-report.json`,JSON.stringify({sources,framesPerScene:27,errors},null,2)+'\n')
 if(errors.length)throw new Error(JSON.stringify(errors))
}finally{await browser.close()}

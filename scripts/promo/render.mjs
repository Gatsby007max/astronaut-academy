import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'
import assert from 'node:assert/strict'
import { chromium } from '/Users/gatsby/.npm/_npx/31e32ef8478fbf80/node_modules/playwright/index.mjs'

const english=process.argv.includes('--en')
const styleIndex=process.argv.indexOf('--style')
const style=styleIndex<0?'tonal':process.argv[styleIndex+1]
assert.ok(['tonal','dancefloor-dnb'].includes(style),'Unknown soundtrack style')
const dnb=style==='dancefloor-dnb'
if(dnb){assert.ok(english,'DnB edition requires --en');assert.ok(process.argv.includes('--verify'),'DnB reuses the video; run finish-dnb.py, then --verify')}
const edition=dnb?'promo-15s-en-dnb':english?'promo-15s-en':'promo-15s'
const stem=dnb?'astronaut-academy-15s-en-dnb':english?'astronaut-academy-15s-en':'astronaut-academy-15s'
const root=process.cwd(),out=path.join(root,'output',edition),frames=path.join(root,'output/playwright',edition)
await fs.mkdir(out,{recursive:true});await fs.mkdir(frames,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:'/Users/gatsby/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--use-angle=metal','--disable-background-timer-throttling','--disable-renderer-backgrounding']})
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1})
const page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message))
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
const base='http://127.0.0.1:5182'
try{
 if(process.argv.includes('--verify')){
  const metadata=JSON.parse(await fs.readFile(path.join(out,'media-info.json'),'utf8'))
  const video=metadata.streams.find(s=>s.codec_type==='video'),audio=metadata.streams.find(s=>s.codec_type==='audio')
  assert.equal(video.width,1920);assert.equal(video.height,1080)
  assert.equal(video.nb_frames,'450');assert.equal(video.avg_frame_rate,'30/1')
  assert.equal(video.pix_fmt,'yuv420p');assert.equal(video.color_space,'bt709')
  assert.equal(video.level,41);assert.equal(Number(metadata.format.duration),15)
  assert.equal(audio.codec_name,'aac');assert.equal(audio.channels,2)
  await page.goto(`${base}/output/${edition}/index.html`,{waitUntil:'networkidle'})
  const playback=await page.evaluate(async()=>{
   const video=document.querySelector('video')
   video.muted=true
   if(video.readyState<2)await new Promise((resolve,reject)=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',reject,{once:true})})
   const ended=new Promise((resolve,reject)=>{video.addEventListener('ended',resolve,{once:true});setTimeout(()=>reject(new Error('Playback timeout')),22000)})
   await video.play();await ended
   return {duration:video.duration,width:video.videoWidth,height:video.videoHeight,ended:video.ended,error:video.error?.message??null,totalVideoFrames:video.getVideoPlaybackQuality().totalVideoFrames,droppedVideoFrames:video.getVideoPlaybackQuality().droppedVideoFrames}
  })
  assert.equal(playback.ended,true);assert.equal(playback.error,null);assert.equal(errors.length,0)
  const renderReport=JSON.parse(await fs.readFile(path.join(out,'render-report.json'),'utf8'))
  if(english){assert.equal(renderReport.language,'en');assert.equal(renderReport.shotCount,14)}
  const audioReport=dnb?JSON.parse(await fs.readFile(path.join(out,'audio-verification.json'),'utf8')):{}
  const result={...audioReport,format:'1920x1080 / 30 fps / H.264 High Level 4.1 / BT.709 / AAC stereo',durationSeconds:15,frames:450,language:english?'en':'ja',shotCount:renderReport.shotCount??5,bytes:Number(metadata.format.size),playback,errors,...(dnb?{browserPlayback:'PASS'}:{})}
  await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(result,null,2)+'\n')
  console.log(JSON.stringify(result))
 }else if(process.argv.includes('--gameplay')){
  assert.equal(english,false,'Use scripts/promo/en/capture-scenes.mjs for English source footage')
  await page.goto(base,{waitUntil:'networkidle'})
  console.log((await page.locator('body').ariaSnapshot()).slice(0,6500))
  await page.getByRole('button',{name:/訓練を(開始|再開)する/}).click()
  await page.waitForTimeout(1200)
  await page.evaluate(async()=>{
   const {useGame}=await import('/src/game/store.ts')
   useGame.getState().updateSettings({quality:'high',audio:false})
   useGame.setState({introSeen:true,debugMode:false,screen:{name:'module',id:'iss',phase:'quiz'}})
  })
  await page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.stationPoints)>0)
  await page.waitForTimeout(3200)
  await page.screenshot({path:path.join(frames,'gameplay.png')})
  console.log((await page.locator('body').ariaSnapshot()).slice(0,7000))
  await page.getByRole('button',{name:/^[A-D] ザーリャ（Zarya）$/}).click()
  await page.waitForTimeout(500)
  await page.screenshot({path:path.join(frames,'gameplay-answer.png')})
  console.log(JSON.stringify({errors}))
 }else{
  await page.goto(base+(english?'/scripts/promo/en/index.html':'/scripts/promo/index.html'),{waitUntil:'networkidle'})
  await page.waitForFunction(()=>window.promoReady,{timeout:60000})
  console.log(JSON.stringify(await page.evaluate(()=>window.promoInfo)))
  if(process.argv.includes('--preview')){
   const checkpoints=english?await page.evaluate(()=>window.promoInfo.shots.map((s,i,a)=>[`${String(i+1).padStart(2,'0')}-${s.kind}`,(s.start+(a[i+1]?.start??15))/2])):[['opening',1.6],['iss',4.7],['eva',7.8],['training',10.5],['title',13.6]]
   const textChecks=[]
   for(const [name,time] of checkpoints){
    await page.evaluate(t=>window.renderFrame(t),time)
    await page.screenshot({path:path.join(frames,name+'.png')})
    if(english){
     const copy=await page.locator('body').innerText()
     assert.equal(/[\u3040-\u30ff\u4e00-\u9fff]/.test(copy),false,`Non-English visible text: ${name}`)
     textChecks.push({name,time,copy})
    }
   }
   if(english)await fs.writeFile(path.join(out,'copy-check.json'),JSON.stringify(textChecks,null,2)+'\n')
   console.log(JSON.stringify({errors}))
  }else{
   const destination=path.join(out,`${stem}-silent.mp4`)
   const ffmpeg=spawn('/opt/homebrew/bin/ffmpeg',['-hide_banner','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-an','-vf','scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','slow','-crf','17','-profile:v','high','-level:v','4.1','-maxrate','25M','-bufsize','50M','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-r','30','-frames:v','450','-movflags','+faststart',destination])
   const ffmpegDone=once(ffmpeg,'close')
   ffmpeg.stderr.pipe(createWriteStream(path.join(out,'encode.log')))
   for(let frame=0;frame<450;frame++){
    await page.evaluate(t=>window.renderFrame(t),frame/30)
    const bytes=await page.screenshot({type:'jpeg',quality:97,animations:'disabled'})
    if(!ffmpeg.stdin.write(bytes))await once(ffmpeg.stdin,'drain')
    if(frame%60===0)console.log(`rendered ${frame}/450`)
   }
   ffmpeg.stdin.end()
   const [code]=await ffmpegDone
   if(code!==0)throw new Error(`ffmpeg exited ${code}`)
   const report={...(await page.evaluate(()=>window.promoInfo)),frames:450,errors,file:destination}
   await fs.writeFile(path.join(out,'render-report.json'),JSON.stringify(report,null,2)+'\n')
   if(errors.length)throw new Error(JSON.stringify(errors))
   console.log(JSON.stringify(report))
  }
 }
}finally{await browser.close()}

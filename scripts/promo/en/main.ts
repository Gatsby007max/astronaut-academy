import { renderer, scene, camera, station, stationMaterial, suit, suitCloud, stars, earth, drawing, W, H } from './world'

// Fourteen distinct shots. Exact frame boundaries at 30 fps; final title holds 3 s.
const shots=[
 {start:0,kind:'solar',label:'POWER THE MISSION',headline:'LOOK UP.'},
 {start:.9,kind:'wide',label:'INTERNATIONAL SPACE STATION',headline:'GO BEYOND.'},
 {start:1.8,kind:'module',label:'ISS SYSTEMS',headline:'KNOW THE SYSTEM.'},
 {start:2.7,kind:'visor',label:'EXTRAVEHICULAR MOBILITY UNIT',headline:'SUIT UP.'},
 {start:3.6,kind:'suit',label:'PREPARE FOR THE EXTRAORDINARY',headline:'STEP OUTSIDE.'},
 {start:4.5,kind:'eva',label:'NEUTRAL BUOYANCY',headline:'TRAIN FOR EVA.'},
 {start:5.4,kind:'robotics',label:'ROBOTICS',headline:'TAKE CONTROL.'},
 {start:6.3,kind:'t38',label:'FLIGHT TRAINING',headline:'THINK FAST.'},
 {start:7.2,kind:'lunar',label:'LUNAR GEOLOGY',headline:'EXPLORE MORE.'},
 {start:8.1,kind:'emergency',label:'EMERGENCY RESPONSE',headline:'STAY READY.'},
 {start:9,kind:'quiz',label:'KNOWLEDGE CHECK',headline:'TEST YOURSELF.'},
 {start:9.9,kind:'answer',label:'UNDERSTAND WHY',headline:'LEARN. ADAPT.'},
 {start:10.8,kind:'hero',label:'LEARN TO GO BEYOND',headline:'YOUR MISSION AWAITS.'},
 {start:12,kind:'title',label:'',headline:''},
]
const clips=['eva','robotics','t38','lunar','emergency']
const $=(id:string)=>document.getElementById(id)!
const image=$('clip') as HTMLImageElement
const guide=$('guide')
shots.forEach(()=>guide.appendChild(document.createElement('i')))
const clamp=(x:number)=>Math.max(0,Math.min(1,x))
const smooth=(x:number)=>{const p=clamp(x);return p*p*(3-2*p)}
let previous=-1,loaded=''
async function renderFrame(time:number){
 const t=Math.min(14.999,Math.max(0,time))
 const i=shots.findLastIndex(s=>t+1e-7>=s.start),s=shots[i]
 const local=t-s.start,duration=(shots[i+1]?.start??15)-s.start,p=clamp(local/duration)
 const isClip=clips.includes(s.kind),isSuit=s.kind==='visor'||s.kind==='suit',isQuiz=s.kind==='quiz'||s.kind==='answer',isEnd=s.kind==='title'
 if(previous!==i){
  $('label').textContent=s.label;$('headline').textContent=s.headline
  $('badge').textContent=`MISSION PREVIEW / ${String(i+1).padStart(2,'0')}`
  for(let k=0;k<shots.length;k++)guide.children[k].className=k===i?'active':k<i?'done':''
  previous=i
 }
 $('caption').style.display=isEnd?'none':'block'
 $('caption').style.opacity=String(.3+.7*smooth(local/.095))
 $('caption').style.transform=`translateY(${(1-smooth(local/.17))*9}px)`
 $('headline').style.fontSize=isQuiz?'74px':s.kind==='hero'?'90px':'104px'
 $('question').style.display=isQuiz?'block':'none'
 $('question').className=s.kind==='answer'?'correct':''
 $('end').style.display=isEnd?'block':'none'
 $('end').style.opacity=String(smooth(local/.20))
 image.style.opacity=isClip?'1':'0'
 if(isClip){
  const frame=Math.min(26,Math.max(0,Math.floor(local*30+1e-5)))
  const url=`/output/playwright/promo-15s-en/${s.kind}/${String(frame).padStart(2,'0')}.png`
  if(loaded!==url){image.src=url;await image.decode();loaded=url}
  image.style.transform=`scale(${1.025+p*.035}) translateX(${(p-.5)*(i%2?20:-20)}px)`
 }
 station.visible=!isSuit&&!isClip
 suit.visible=suitCloud.points.visible=isSuit;suitCloud.contours.visible=false
 earth.visible=!isClip
 stationMaterial.uniforms.time.value=t
 stationMaterial.uniforms.focus.value=['solar','module','quiz','answer'].includes(s.kind)?1:.72
 suitCloud.material.uniforms.time.value=t
 camera.position.set(0,.1,4.9);camera.lookAt(0,.05,0)
 switch(s.kind){
  case 'solar':station.position.set(.78,-.03,0);station.scale.setScalar(2.18-p*.21);station.rotation.set(.6+p*.1,.06+p*.15,-.18);break
  case 'wide':station.position.set(.35,.12,0);station.scale.setScalar(1.20+p*.04);station.rotation.set(.64,.12+p*.21,-.31);break
  case 'module':station.position.set(.34,.25,0);station.scale.setScalar(2.30+p*.14);station.rotation.set(.68,.68+p*.14,-.22);break
  case 'visor':suit.position.set(.66,-.91,0);suit.scale.setScalar(1.92+p*.13);suit.rotation.set(.01,Math.PI-.32+p*.19,-.065);break
  case 'suit':suit.position.set(.78,.07,0);suit.scale.setScalar(.95+p*.035);suit.rotation.set(.03,Math.PI+.18-p*.22,-.08);break
  case 'quiz':case 'answer':station.position.set(-.66,.18,0);station.scale.setScalar(.98+p*.025);station.rotation.set(.63,.22+(s.kind==='answer'?.10:0)+p*.10,-.18);break
  case 'hero':station.position.set(.42,.22,0);station.scale.setScalar(1.27-p*.05);station.rotation.set(.71,.47+p*.17,-.26);break
  case 'title':station.position.set(1.02,.06,-.1);station.scale.setScalar(.95+p*.035);station.rotation.set(.65,.4+p*.12,-.20);break
 }
 stars.rotation.y=t*.0014;earth.rotation.y=t*.004
 renderer.render(scene,camera)
 $('fade').style.opacity=String((1-smooth(t/.10))*.25+smooth((t-14.85)/.15)*.2)
 $('cut-line').style.opacity=String(i>0?(1-clamp(local/.07))*.35:0)
}
await document.fonts.ready
Object.assign(window,{renderFrame,promoReady:true,promoInfo:{width:W,height:H,fps:30,duration:15,language:'en',shotCount:shots.length,shots,stationPoints:drawing.count,suitPoints:suitCloud.count}})
await renderFrame(.4)
if(new URLSearchParams(location.search).has('play')){
 const start=performance.now();const tick=async()=>{await renderFrame(((performance.now()-start)/1000)%15);requestAnimationFrame(tick)};void tick()
}

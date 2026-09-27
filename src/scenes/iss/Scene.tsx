import { trt } from '../../i18n/tr'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { Vector3 } from 'three'
import { CameraRig, type Shot } from '../../engine/CameraRig'
import { useSceneSetup } from '../../engine/useSceneSetup'
import { useGame } from '../../game/store'
import { usePractice } from '../../minigames/practice'
import { useIss, useIssHighlight } from '../../world/IssModel'
import { StationCloud } from '../../world/station/StationCloud'
import { ISS_PARTS, type IssPartKey } from '../../world/issParts'
import { SpaceLighting } from '../../world/SpaceLighting'
import { Starfield } from '../../world/Starfield'
const sun=new Vector3(-1,1,2).normalize()
const markerOffsets=[[-95,20],[-60,-55],[85,45],[0,60],[65,-55]] as const
export default function IssScene(){
 const iss=useIss();const focus=useGame(s=>s.focus);const active=usePractice(s=>s.active)
 const size=useThree(s=>s.size)
 const narrow=size.width<900
 const screen=useGame(s=>s.screen)
 const brief=screen.name==='module'&&screen.phase==='brief'
 useSceneSetup({near:.01,far:100,fov:42,ambient:'orbit',fx:{bloomIntensity:.4,bloomThreshold:1.2}})
 useIssHighlight(iss,focus in ISS_PARTS?focus as IssPartKey:null)
 const shots=useMemo(()=>{
  // Fit the full NASA silhouette inside the visible region, including tall
  // desktop windows and the separate portrait lesson/question panel heights.
  const reserved=brief?532:screen.name==='module'&&screen.phase==='quiz'?572:462
  const fov=narrow?48:42
  const portraitShift=brief?.18:.14
  const freeHeight=Math.max(70,size.height*(brief?.42:.48)-218)
  const frameWidth=narrow?Math.min(size.width-48,freeHeight*1.5):size.width-reserved-72
  const fullHeight=size.height*(narrow?1+2*portraitShift:1)
  const distance=Math.max(3.8,2.55*fullHeight/(2*Math.tan(fov*Math.PI/360)*Math.max(90,frameWidth)))
  const overview=new Vector3(.45,2.8,4.2).normalize().multiplyScalar(distance)
  const s:Record<string,Shot>={overview:{position:overview.toArray(),target:[0,0,0],fov:narrow?48:42}}
  for(const[k,p]of Object.entries(iss.parts))s[k]={position:p.center.clone().add(new Vector3(1,.7,1.4).multiplyScalar(narrow?1.4:1)).toArray(),target:p.center.toArray(),fov:narrow?42:38}
  return s
 },[iss,narrow,brief,size.width,size.height,screen])
 return <>
  <Starfield radius={80}/><SpaceLighting sunDir={sun} intensity={4}/><StationCloud iss={iss}/>
  <CameraRig shots={shots} interactive minDistance={.3} maxDistance={40}/>
  {active==='identify'&&(['destiny','quest','cupola','kibo','tranquility'] as IssPartKey[]).map((id,i)=>{
   const [x,y]=narrow?markerOffsets[i]:[0,0]
   return <Html key={id} position={iss.parts[id].center.clone().add(new Vector3(0,.08+i*.03,0))} center zIndexRange={[10,0]}>
    <div style={{position:'relative',width:1,height:1}}>
     {narrow&&<svg width="1" height="1" aria-hidden="true" className="pointer-events-none absolute overflow-visible text-hud/65"><line x1={0} y1={0} x2={x} y2={y} stroke="currentColor" strokeWidth={1}/><circle r={2} fill="currentColor"/></svg>}
     <button aria-label={trt`区画 ${ISS_PARTS[id].label}`} className="absolute rounded-full border border-hud bg-slate-950/90 px-2 py-1 text-xs text-hud" style={{transform:`translate(${x}px,${y}px) translate(-50%,-50%)`,minWidth:narrow?44:undefined,minHeight:narrow?44:undefined}} onClick={()=>usePractice.getState().set({selected:id})}>{String.fromCharCode(65+i)}</button>
    </div>
   </Html>
  })}
 </>
}

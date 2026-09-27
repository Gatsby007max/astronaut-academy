import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, PointLight, Points } from 'three'
import { CameraRig, type Shot } from '../../engine/CameraRig'
import { useSceneSetup } from '../../engine/useSceneSetup'
import { audio } from '../../engine/audio'
import { usePractice } from '../../minigames/practice'
import { useFx } from '../../engine/fx'
import { smokeTexture } from '../../engine/textures'
import { Monitor } from '../../world/Monitor'
const shots:Record<string,Shot>={overview:{position:[0,0,5],target:[0,0,-3],fov:56},cabin:{position:[0,0,4],target:[0,0,-4],fov:58},hatch:{position:[0,.1,1],target:[0,0,-5],fov:50},alarmPanel:{position:[.2,.15,3],target:[-1.7,.45,-1],fov:50},mask:{position:[0,0,3],target:[1.5,-.3,-1],fov:50},extinguisher:{position:[-.2,0,3],target:[1.6,-.8,-2],fov:50}}
export default function EmergencyScene(){
 const event=usePractice(s=>s.event);const alarm=useRef<PointLight>(null);const smoke=useRef<Points>(null)
 useSceneSetup({near:.05,far:60,ambient:'cabin',fx:{bloomIntensity:.8,vignette:.7}})
 const isFire=event.startsWith('fire')
 useEffect(()=>{useFx.getState().set({chroma:event ? .001 : 0}); audio.alarm(!!event, event.startsWith('fire') ? 'fire' : event==='pressure' ? 'depress' : 'toxic');return()=>{useFx.getState().set({chroma:0});audio.alarm(false)}},[event])
 const positions=useMemo(()=>Float32Array.from({length:80*3},(_,i)=>i%3===0?-1.4+Math.sin(i)*.5:i%3===1?Math.cos(i)*.8:-3+(i%20)*.25),[])
 useFrame(({clock})=>{if(alarm.current)alarm.current.intensity=event?7+Math.sin(clock.elapsedTime*7)*5:1;if(smoke.current)smoke.current.position.x=Math.sin(clock.elapsedTime*.15)*.25})
 return <><color attach="background" args={['#050811']}/><ambientLight intensity={.6}/><pointLight position={[0,1.2,2]} color="#bedfff" intensity={18}/><pointLight ref={alarm} position={[-1.4,1,-2]} color={event?'#ff283e':'#69dbff'} intensity={1}/>
 {Array.from({length:7},(_,i)=><group key={i} position={[0,0,-i*1.8+3]}>{[0,1,2,3].map(side=><group key={side} rotation={[0,0,side*Math.PI/2]}><mesh position={[0,2,-.8]} receiveShadow><boxGeometry args={[4,.15,1.7]}/><meshStandardMaterial color={i%2?'#5b6673':'#76808c'} roughness={.75}/></mesh><mesh position={[0,1.88,-.8]}><boxGeometry args={[2.3,.025,.028]}/><meshBasicMaterial color={event&&side===0?new Color(3,.03,.05):new Color(.6,1.2,1.6)}/></mesh><mesh position={[-1.65,1.8,-.8]}><boxGeometry args={[.075,.09,1.2]}/><meshStandardMaterial color="#ddb960" metalness={.5}/></mesh></group>)}</group>)}
 <mesh position={[0,0,-7]}><boxGeometry args={[4,4,.2]}/><meshStandardMaterial color="#919ca9"/></mesh><mesh position={[0,0,-6.85]}><torusGeometry args={[1.1,.16,8,8]}/><meshStandardMaterial color="#253a49" metalness={.5}/></mesh><mesh position={[0,0,-6.86]}><circleGeometry args={[1,8]}/><meshStandardMaterial color="#536875"/></mesh><mesh position={[.55,0,-6.7]}><boxGeometry args={[.3,.05,.08]}/><meshStandardMaterial color="#ecb33e"/></mesh>
 <group position={[-1.83,.4,-1]} rotation={[0,Math.PI/2,0]}><Monitor label={event?'CAUTION / WARNING':'ENVIRONMENT'} alert={!!event} scale={[.8,.8,.8]}/></group>
 <mesh position={[1.8,-.7,-2]}><cylinderGeometry args={[.16,.16,.7,16]}/><meshStandardMaterial color="#ae273c" metalness={.3}/></mesh><mesh position={[1.8,.05,-1]}><boxGeometry args={[.16,.45,.4]}/><meshStandardMaterial color="#f1b94c"/></mesh>
 {isFire&&<points ref={smoke}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial size={1.3} color="#999fa9" map={smokeTexture()} transparent opacity={.13} depthWrite={false}/></points>}
 <CameraRig shots={shots} drift={.004} parallax={.2}/></>
}

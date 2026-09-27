import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { PointLight } from 'three'
import { CameraRig, type Shot } from '../../engine/CameraRig'
import { useSceneSetup } from '../../engine/useSceneSetup'
import { usePractice } from '../../minigames/practice'
import { Monitor } from '../../world/Monitor'
import { panelTexture } from '../../engine/textures'
const shots:Record<string,Shot>={overview:{position:[6,4.5,10],target:[0,1,-4],fov:52},room:{position:[8,5,9],target:[0,1,-4],fov:56},flight:{position:[2,2,3],target:[0,1,-2],fov:50},capcom:{position:[-5,2.5,2],target:[-3,1,-4],fov:48},consoles:{position:[5,3,6],target:[0,1,-3],fov:50},screen:{position:[2,2.5,5],target:[0,3,-9],fov:48}}
export default function MccScene(){
 useSceneSetup({near:.05,far:80,ambient:'mcc',fx:{bloomIntensity:.6,vignette:.55}})
 const selected=usePractice(s=>s.selected);const event=usePractice(s=>s.event);const light=useRef<PointLight>(null)
 const map=useMemo(()=>panelTexture('world-flight-map',(c,s)=>{c.fillStyle='#031323';c.fillRect(0,0,s,s);c.strokeStyle='#154b62';for(let i=0;i<12;i++){c.beginPath();c.moveTo(i*s/12,0);c.lineTo(i*s/12,s);c.moveTo(0,i*s/12);c.lineTo(s,i*s/12);c.stroke()}c.strokeStyle='#61e3f5';c.lineWidth=3;for(let j=0;j<2;j++){c.beginPath();for(let i=0;i<s;i++)c.lineTo(i,s*.5+Math.sin(i/s*Math.PI*2+j*.7)*s*.3);c.stroke()}c.fillStyle='#ffc76a';c.beginPath();c.arc(s*.45,s*.42,7,0,7);c.fill();c.fillStyle='#cce5f1';c.font='21px monospace';c.fillText('ORBITAL TRACK / TRAINING',25,40);c.fillText('HOUSTON MISSION CONTROL',25,s-25)},512),[])
 useFrame(({clock})=>{if(light.current)light.current.intensity=event?12+Math.sin(clock.elapsedTime*2)*4:9})
 const names=['ETHOS','SPARTAN','ADCO','CRONUS','FAO','ROBO','SURGEON','CAPCOM','FLIGHT']
 return <><color attach="background" args={['#020710']}/><ambientLight intensity={.22}/><pointLight ref={light} position={[0,4,-6]} color="#82bded" intensity={18}/><pointLight position={[0,5,4]} color="#ffc494" intensity={20}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.1,0]} receiveShadow><planeGeometry args={[24,26]}/><meshStandardMaterial color="#151a22" roughness={.32} metalness={.35}/></mesh><mesh position={[0,3,-10]}><boxGeometry args={[24,7,.3]}/><meshStandardMaterial color="#101a2a"/></mesh>
 <mesh position={[0,3,-9.8]}><planeGeometry args={[7,4]}/><meshBasicMaterial map={map}/></mesh><Monitor label="ORBIT / STATUS" position={[-7,3,-9.7]} scale={[2,2,2]}/><Monitor label="CREW / SYSTEMS" position={[7,3,-9.7]} scale={[2,2,2]}/>
 {names.map((name,i)=>{const x=(i%3-1)*4;const z=Math.floor(i/3)*3-6;return <group key={name} position={[x,0,z]}><mesh position={[0,.55,0]}><boxGeometry args={[3.4,1.1,1.35]}/><meshStandardMaterial color="#343e4d" metalness={.25} roughness={.5}/></mesh><group position={[0,1.3,-.15]} rotation={[-.12,0,0]}><Monitor label={name} alert={selected===name} scale={[.8,.75,.8]}/><Monitor label="DATA" position={[1.05,0,-.04]} scale={[.32,.65,.5]}/></group><mesh position={[0,.7,1.2]}><boxGeometry args={[.7,.15,.6]}/><meshStandardMaterial color="#132435"/></mesh><mesh position={[0,1.1,1.45]}><boxGeometry args={[.65,.7,.12]}/><meshStandardMaterial color="#172d44"/></mesh></group>})}
 {[-7,7].map(x=><mesh key={x} position={[x,5,-1]}><boxGeometry args={[.07,.05,15]}/><meshBasicMaterial color={[1.2,1.5,2]}/></mesh>)}<CameraRig shots={shots} drift={.004}/></>
}

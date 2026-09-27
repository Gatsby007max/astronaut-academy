import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { AdditiveBlending, Group } from 'three'
import { CameraRig, type Shot } from '../../engine/CameraRig'
import { useSceneSetup } from '../../engine/useSceneSetup'
import { useGame } from '../../game/store'
const shots:Record<string,Shot>={overview:{position:[3,1.5,6],target:[0,.1,0]},body:{position:[2,.7,5],target:[0,0,0]},bones:{position:[1,-.7,3.5],target:[0,-.8,0]},muscles:{position:[1,0,3.5],target:[0,-.3,0]},eyes:{position:[.3,1.5,2],target:[0,1.3,0]},fluid:{position:[2,1,4],target:[0,.6,0]},heart:{position:[.4,.7,2.3],target:[0,.6,0]},brain:{position:[.5,1.7,2.2],target:[0,1.5,0]},radiation:{position:[3,1,5],target:[0,0,0]}}
function Bone({position,length=.8}:{position:[number,number,number];length?:number}){return <mesh position={position}><capsuleGeometry args={[.12,length,5,10]}/><meshBasicMaterial color="#7fe3ff" wireframe transparent opacity={.35}/></mesh>}
export default function MedicineScene(){
 const body=useRef<Group>(null);const focus=useGame(s=>s.focus)
 useSceneSetup({near:.05,far:80,ambient:'hologram',fx:{bloomIntensity:1.15,bloomThreshold:.3,vignette:.7}})
 useFrame(({clock})=>{if(body.current)body.current.rotation.y=Math.sin(clock.elapsedTime*.2)*.18})
 return <><color attach="background" args={['#020913']}/><ambientLight intensity={.3}/><pointLight position={[0,2,2]} color="#ff8fb1" intensity={12}/><gridHelper args={[30,50,'#124b5b','#082732']} position={[0,-2.3,0]}/><group ref={body}>
 <mesh position={[0,1.4,0]}><sphereGeometry args={[.33,24,16]}/><meshBasicMaterial color="#7fe3ff" wireframe transparent opacity={.32}/></mesh><mesh position={[0,.3,0]} scale={[.75,1.25,.4]}><sphereGeometry args={[.7,24,24]}/><meshBasicMaterial color="#7fe3ff" wireframe transparent opacity={.25}/></mesh>
 <Bone position={[0,.9,0]} length={.2}/>{[-1,1].map(x=><group key={x}><Bone position={[x*.85,.4,0]} length={.85}/><Bone position={[x*1,-.55,.1]} length={.55}/><Bone position={[x*.32,-1,0]} length={.7}/><Bone position={[x*.32,-1.8,.05]} length={.65}/><mesh position={[x*.13,1.46,.3]}><sphereGeometry args={[.045,12,8]}/><meshBasicMaterial color={focus==='eyes'?'#ff8fb1':'#7fe3ff'}/></mesh></group>)}
 <mesh position={[-.12,.65,.2]} scale={[1,1.3,1]}><sphereGeometry args={[.13,16,12]}/><meshBasicMaterial color={[2,.08,.3]}/></mesh>
 {Array.from({length:8},(_,i)=><mesh key={i} position={[0,.75-i*.14,.04]} rotation={[Math.PI/2,0,0]} scale={[1,.55,1]}><torusGeometry args={[.3+i*.007,.016,6,30]}/><meshBasicMaterial color="#baf4ff" transparent opacity={.6}/></mesh>)}
 </group><Scan/><CameraRig shots={shots} drift={.006}/></>
}
function Scan(){const g=useRef<Group>(null);useFrame(({clock})=>{if(g.current)g.current.position.y=Math.sin(clock.elapsedTime*.8)*2});return <group ref={g}><mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3,2]}/><meshBasicMaterial color="#ff8fb1" transparent opacity={.08} blending={AdditiveBlending} depthWrite={false} side={2}/></mesh><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.3,.014,6,80]}/><meshBasicMaterial color={[2,.4,.8]}/></mesh></group>}

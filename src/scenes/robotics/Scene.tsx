import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, Mesh, PerspectiveCamera, Quaternion, Vector3, Vector4 } from 'three'
import { CameraRig, type Shot } from '../../engine/CameraRig'
import { TIERS } from '../../engine/quality'
import { useSceneSetup } from '../../engine/useSceneSetup'
import { useGame } from '../../game/store'
import { solveArm, useRobotics, type V3, ARM_LENGTHS } from '../../minigames/robotics'
import { Starfield } from '../../world/Starfield'
const shots:Record<string,Shot>={overview:{position:[9,6,10],target:[2,1,0],fov:47},arm:{position:[9,5,9],target:[2,1,0],fov:47},endEffector:{position:[5,3,5],target:[3,2,0],fov:45},vehicle:{position:[7,3,7],target:[3,2,0],fov:44},workstation:{position:[10,6,10],target:[2,1,0],fov:48},dextre:{position:[6,4,7],target:[1,1,0],fov:47}}
function Arm(){
 const links=useRef<(Mesh|null)[]>([]);const joints=useRef<(Mesh|null)[]>([]);const ship=useRef<Group>(null);const hand=useRef(new Vector3(2,1,1));const last=useRef(hand.current.clone());const stable=useRef(0);const time=useRef(0);const tick=useRef(0);const seed=useRef<V3[]|undefined>(undefined)
 const tmp=useMemo(()=>({a:new Vector3(),b:new Vector3(),dir:new Vector3(),up:new Vector3(0,1,0),q:new Quaternion()}),[])
 const running=useRobotics(s=>s.running)
 useFrame((_,delta)=>{const dt=Math.min(delta,.05);const s=useRobotics.getState();if(s.running)time.current+=dt;const target:V3=s.captured?s.target:[3+Math.sin(time.current*.18)*.14,2+Math.sin(time.current*.12)*.1,Math.sin(time.current*.15)*.08];
 if(ship.current)ship.current.position.set(...target)
 hand.current.lerp(tmp.a.set(...s.command),1-Math.exp(-dt*2));const solved=solveArm(hand.current.toArray(),ARM_LENGTHS,seed.current);seed.current=solved
 solved.forEach((v,i)=>{joints.current[i]?.position.set(...v);if(i<ARM_LENGTHS.length){const l=links.current[i];if(l){tmp.a.set(...v);tmp.b.set(...solved[i+1]);l.position.copy(tmp.a).add(tmp.b).multiplyScalar(.5);tmp.dir.copy(tmp.b).sub(tmp.a).normalize();l.quaternion.setFromUnitVectors(tmp.up,tmp.dir)}}})
 const actual=tmp.a.set(...solved.at(-1)!);const speed=actual.distanceTo(last.current)/Math.max(dt,.001);last.current.copy(actual);const error=actual.distanceTo(tmp.b.set(...target));if(error<.14&&speed<.18&&Math.abs(s.roll)<=6)stable.current+=dt;else stable.current=0
 tick.current+=dt;if(tick.current>.1){tick.current=0;s.set({hand:actual.toArray(),target,error,speed,stable:Math.min(2,stable.current)})}
 })
 return <><group>{ARM_LENGTHS.map((length,i)=><mesh key={i} ref={e=>{links.current[i]=e}} castShadow><cylinderGeometry args={[i===2||i===3?.12:.16,i===2||i===3?.12:.16,length,12]}/><meshStandardMaterial color="#dfdfd5" roughness={.5} metalness={.25}/></mesh>)}{Array.from({length:8},(_,i)=><mesh ref={e=>{joints.current[i]=e}} key={i}><sphereGeometry args={[i===7?.19:.22,16,10]}/><meshStandardMaterial color={i===7?'#59e3ea':'#686e72'} emissive={i===7?'#065967':'#000'} metalness={.4}/></mesh>)}</group>
 <group ref={ship}><mesh position={[0,0,-.85]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.7,.65,1.6,24]}/><meshStandardMaterial color="#b3a796" roughness={.65} metalness={.3}/></mesh><mesh rotation={[0,0,0]}><torusGeometry args={[.18,.025,8,30]}/><meshBasicMaterial color={running?[2,1,.1]:[.2,2,1]}/></mesh><mesh><boxGeometry args={[.06,.28,.08]}/><meshBasicMaterial color={[2,1,.1]}/></mesh>{[-1,1].map(x=><mesh key={x} position={[x*1.5,0,-1]}><boxGeometry args={[1.5,.03,1.1]}/><meshStandardMaterial color="#153355" metalness={.6} roughness={.3}/></mesh>)}</group></>
}
function CameraFeeds(){const {gl,scene,camera,size}=useThree();const active=useGame(s=>s.screen.name==='module'&&s.screen.phase==='mini');const tier=useGame(s=>s.tier);const cams=useMemo(()=>[new PerspectiveCamera(46,1,.05,200),new PerspectiveCamera(40,1,.05,200),new PerspectiveCamera(50,1,.02,200)],[]);const vp=useMemo(()=>new Vector4(),[]);const sc=useMemo(()=>new Vector4(),[])
 useFrame(()=>{if(!TIERS[tier].post)gl.render(scene,camera);if(!active)return;gl.getViewport(vp);gl.getScissor(sc);const enabled=gl.getScissorTest();const auto=gl.autoClear;const mobile=size.width<900;const w=Math.floor(mobile?(size.width-32)/3:Math.min(190,(size.width*.56-40)/3));const h=Math.floor(w*.7);const y=mobile?size.height-145-h:52;const s=useRobotics.getState();cams[0].position.set(7,6,7);cams[1].position.set(7,2,-4);cams[2].position.set(s.hand[0],s.hand[1]+.35,s.hand[2]+.4);cams.forEach((c,i)=>{c.aspect=w/h;c.lookAt(...s.target);c.updateProjectionMatrix();gl.setViewport(12+i*(w+8),y,w,h);gl.setScissor(12+i*(w+8),y,w,h);gl.setScissorTest(true);gl.autoClear=true;gl.render(scene,c)});gl.autoClear=auto;gl.setViewport(vp);gl.setScissor(sc);gl.setScissorTest(enabled)},2)
 return null}
export default function RoboticsScene(){useSceneSetup({near:.03,far:200,ambient:'cabin',fx:{bloomIntensity:.65}});return <><Starfield radius={150}/><hemisphereLight args={['#b7d6ff','#13365e',1.2]}/><directionalLight position={[-8,7,6]} intensity={4}/><mesh position={[0,-.4,0]}><boxGeometry args={[5,.6,3]}/><meshStandardMaterial color="#c2c7c9" roughness={.55} metalness={.35}/></mesh><Arm/><CameraRig shots={shots} drift={0} parallax={0}/><CameraFeeds/></>}

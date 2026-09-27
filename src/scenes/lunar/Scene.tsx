import { Html } from '@react-three/drei'
import { use, useEffect, useMemo } from 'react'
import { BufferAttribute, Color, PlaneGeometry, Vector3 } from 'three'
import { CameraRig, type Shot } from '../../engine/CameraRig'
import { LUNAR_TERRAIN } from '../../engine/assets'
import { useSceneSetup } from '../../engine/useSceneSetup'
import { useGame } from '../../game/store'
import { usePractice } from '../../minigames/practice'
import { SAMPLE_SITES } from '../../minigames/lunar'
import { Starfield } from '../../world/Starfield'
import { Earth } from '../../world/Earth'
let elevation:Promise<ArrayBuffer>|undefined
function data(){return elevation??=fetch(`${import.meta.env.BASE_URL}${LUNAR_TERRAIN.file.replace(/^\//, '')}`).then(r=>{if(!r.ok)throw new Error('Moon elevation unavailable');return r.arrayBuffer()})}
function heightAt(values:Uint16Array,x:number,z:number){const ix=Math.max(0,Math.min(256,Math.round((x/72+.5)*256)));const iz=Math.max(0,Math.min(256,Math.round((z/72+.5)*256)));return (LUNAR_TERRAIN.minMeters+(LUNAR_TERRAIN.maxMeters-LUNAR_TERRAIN.minMeters)*values[iz*257+ix]/65535)/1000}
export default function LunarScene(){
 const raw=use(data());const values=useMemo(()=>new Uint16Array(raw),[raw]);const active=usePractice(s=>s.active);const selected=usePractice(s=>s.selected);const tier=useGame(s=>s.tier)
 const heights=useMemo(()=>SAMPLE_SITES.map(s=>heightAt(values,s.position[0],s.position[2])),[values])
 const level=heightAt(values,0,0)
 const geometry=useMemo(()=>{const g=new PlaneGeometry(72,72,tier==='low'?64:128,tier==='low'?64:128);g.rotateX(-Math.PI/2);const p=g.attributes.position;const colors=new Float32Array(p.count*3);const c=new Color();for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=heightAt(values,x,z);p.setY(i,h);const grit=.32+.1*Math.sin(x*7+z*11)*Math.cos(z*9)+h*.016;c.setRGB(grit*1.1,grit*1.07,grit);c.toArray(colors,i*3)}g.setAttribute('color',new BufferAttribute(colors,3));g.computeVertexNormals();return g},[values,tier])
 useEffect(()=>()=>geometry.dispose(),[geometry])
 useSceneSetup({near:.05,far:1200,ambient:'lunar',fx:{bloomIntensity:.4,vignette:.52}})
 const shots=useMemo<Record<string,Shot>>(()=>({overview:{position:[18,15,24],target:[0,level,0],fov:48},surface:{position:[12,level+7,14],target:[0,level,0],fov:48},rocks:{position:[12,level+7,18],target:[0,level,3],fov:50},crater:{position:[8,18,18],target:[0,level,-2],fov:50},shadow:{position:[4,12,14],target:[0,level,-4],fov:48},earth:{position:[0,level+3,12],target:[-25,15,-100],fov:50},orion:{position:[40,36,48],target:[0,0,0],fov:44}}),[level])
 const sun=useMemo(()=>new Vector3(-1,.12,.3).normalize(),[])
 return <><color attach="background" args={['#010207']}/><Starfield radius={800} intensity={.08}/><ambientLight intensity={.12}/><directionalLight position={[-50,7,20]} intensity={4} color="#fff0d6" castShadow={tier!=='low'} shadow-mapSize={[2048,2048]} shadow-camera-left={-38} shadow-camera-right={38} shadow-camera-top={38} shadow-camera-bottom={-38} shadow-camera-far={160} shadow-normalBias={.08}/><mesh geometry={geometry} receiveShadow castShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>
 <Earth position={new Vector3(-50,22,-170)} radius={6} sunDir={sun} spin={0}/>
 {SAMPLE_SITES.map((s,i)=><group key={s.id} position={[s.position[0],heights[i]+.4,s.position[2]]}><mesh scale={[.8,.55,.65]} rotation={[i*.3,.5+i,0]} castShadow onClick={()=>active&&usePractice.getState().set({selected:s.id})}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color={s.color} roughness={1} emissive={selected===s.id?'#584174':'#000'} emissiveIntensity={.5}/></mesh>{s.kind==='breccia'&&Array.from({length:5},(_,j)=><mesh key={j} position={[Math.sin(j*3)*.5,.24,Math.cos(j*3)*.35]} scale={[.16,.1,.14]}><icosahedronGeometry args={[1,0]}/><meshStandardMaterial color="#d4d0c1"/></mesh>)}{active==='sample'&&<Html position={[0,1,0]} center zIndexRange={[8,0]}><button className="whitespace-nowrap rounded border border-violet-300/70 bg-slate-950/90 px-3 py-1 text-xs text-violet-200" onClick={()=>usePractice.getState().set({selected:s.id})}>{s.label}</button></Html>}</group>)}<CameraRig shots={shots} drift={.003} parallax={.03}/></>
}

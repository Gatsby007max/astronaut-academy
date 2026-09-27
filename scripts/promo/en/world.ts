import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { buildStationGeometry } from '../../../src/world/station/stationGeometry'
import { stationVertex, stationFragment } from '../../../src/world/station/stationShaders'
import { buildCloud } from '../../../src/engine/particles/buildCloud'
import { attractorPath, FLOW_SAMPLES } from '../../../src/engine/particles/attractor'
import { ISS_PARTS, normalizeIssName } from '../../../src/world/issParts'

// Offline film renderer: explicit frame times; never mounted in the game bundle.
const W=1920,H=1080
const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true})
renderer.setSize(W,H);renderer.setPixelRatio(1)
renderer.outputColorSpace=T.SRGBColorSpace
renderer.setClearColor(0x03070e,0)
document.querySelector('#webgl')!.appendChild(renderer.domElement)
const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,W/H,.01,300)
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
const [issAsset,emuAsset]=await Promise.all([loader.loadAsync('/assets/iss_hd.glb'),loader.loadAsync('/assets/emu.glb')])

function normalize(root:T.Group,size:number){
 const b=new T.Box3().setFromObject(root),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3())
 const k=size/Math.max(s.x,s.y,s.z);root.scale.setScalar(k);root.position.copy(c).multiplyScalar(-k)
 const group=new T.Group();group.add(root);group.updateMatrixWorld(true);return group
}
const original=normalize(issAsset.scene,2.4),meshes:T.Mesh[]=[]
original.traverse(o=>{if((o as T.Mesh).isMesh){let p:T.Object3D|null=o
 while(p){const name=normalizeIssName(p.name);if(Object.values(ISS_PARTS).some(part=>part.match.test(name))){o.userData.part=name;break}p=p.parent}
 meshes.push(o as T.Mesh)
}})
const drawing=buildStationGeometry(meshes,240000)
const flow=new T.DataTexture(attractorPath(),FLOW_SAMPLES,1,T.RGBAFormat,T.FloatType)
flow.minFilter=flow.magFilter=T.NearestFilter;flow.needsUpdate=true
const stationMaterial=new T.ShaderMaterial({
 uniforms:{flowPath:{value:flow},flowSteps:{value:FLOW_SAMPLES},time:{value:0},focus:{value:.55},motion:{value:1},pixelRatio:{value:1.25},selectedPart:{value:-2}},
 vertexShader:stationVertex,fragmentShader:stationFragment,vertexColors:true,transparent:true,depthWrite:false,
})
const station=new T.Group(),points=new T.Points(drawing.geometry,stationMaterial)
points.frustumCulled=false;points.renderOrder=7
const depth=new T.Mesh(drawing.depthGeometry,new T.MeshBasicMaterial({colorWrite:false,depthWrite:true,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:2}))
depth.renderOrder=-2;station.add(depth,points);scene.add(station)

const suit=normalize(emuAsset.scene,2.5)
scene.add(suit)
const suitCloud=buildCloud(suit,240000)
suitCloud.material.uniforms.focus.value=1
suitCloud.material.vertexShader=suitCloud.material.vertexShader
 .replace('gl_Position = projectionMatrix * viewPosition;', 'viewPosition.z += 0.002; gl_Position = projectionMatrix * viewPosition;')
 .replace('gl_PointSize *= 1.0 + rim * 0.28;', 'gl_PointSize *= (1.0 + rim * 0.28) * 1.25;')
suit.traverse(o=>{if((o as T.Mesh).isMesh){
 const mesh=o as T.Mesh
 const clone=(m:T.Material)=>{const d=m.clone();d.visible=true;d.colorWrite=false;d.depthWrite=true;d.side=T.DoubleSide;d.polygonOffset=true;d.polygonOffsetFactor=4;d.polygonOffsetUnits=4;return d}
 mesh.material=Array.isArray(mesh.material)?mesh.material.map(clone):clone(mesh.material)
 o.renderOrder=-2
}})
scene.add(suitCloud.points,suitCloud.contours)

let seed=7783
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const starPositions=[],starColors=[]
for(let i=0;i<1300;i++){
 starPositions.push((rnd()-.5)*120,(rnd()-.5)*70,-20-rnd()*60)
 const l=.15+rnd()*.45;starColors.push(l*.7,l*.87,l)
}
const starsGeo=new T.BufferGeometry()
starsGeo.setAttribute('position',new T.Float32BufferAttribute(starPositions,3))
starsGeo.setAttribute('color',new T.Float32BufferAttribute(starColors,3))
const stars=new T.Points(starsGeo,new T.PointsMaterial({size:.035,vertexColors:true,transparent:true,opacity:.65,depthWrite:false}))
scene.add(stars)

// Stylized orbital horizon, also made from points; no invented model details.
const earth=new T.Group(),earthPositions=[],earthColors=[]
for(let i=0;i<60000;i++){
 const theta=rnd()*Math.PI*2,lat=(rnd()-.5)*Math.PI
 const r=13;earthPositions.push(r*Math.cos(lat)*Math.sin(theta),r*Math.sin(lat),r*Math.cos(lat)*Math.cos(theta))
 const color=new T.Color().setRGB(.03,.12+rnd()*.06,.22+rnd()*.12);earthColors.push(color.r,color.g,color.b)
}
const eGeo=new T.BufferGeometry();eGeo.setAttribute('position',new T.Float32BufferAttribute(earthPositions,3));eGeo.setAttribute('color',new T.Float32BufferAttribute(earthColors,3))
earth.add(new T.Points(eGeo,new T.PointsMaterial({vertexColors:true,size:.012,transparent:true,opacity:.45,depthWrite:false})))
earth.position.set(3,-15,-9);scene.add(earth)


export { renderer, scene, camera, station, stationMaterial, suit, suitCloud, stars, earth, drawing, W, H }

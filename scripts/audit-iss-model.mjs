import { NodeIO, getBounds } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
import { writeFile } from 'node:fs/promises'
await MeshoptDecoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder})
const source = await io.read('assets-src/ISS_stationary.glb')
const optimized = await io.read('public/assets/iss.glb')
const names = doc => new Map(doc.getRoot().listNodes().filter(n=>n.getName()).map(n=>[n.getName(),n]))
const a=names(source),b=names(optimized),before=getBounds(source.getRoot().listScenes()[0]),after=getBounds(optimized.getRoot().listScenes()[0])
const span=Math.max(...before.max.map((v,i)=>v-before.min[i]))
const comparisons=[]
for(const [name,node] of a){
 if(!node.getMesh()||!b.has(name))continue
 const x=getBounds(node),y=getBounds(b.get(name))
 const extentError=Math.max(...x.min.map((v,i)=>Math.abs(v-y.min[i])),...x.max.map((v,i)=>Math.abs(v-y.max[i])))
 comparisons.push({name,extentError,percentOfStationSpan:extentError/span*100})
}
const report={source:'https://science.nasa.gov/resource/international-space-station-3d-model/',before,after,originalSpan:span,sourceNamedNodes:a.size,optimizedNamedNodes:b.size,missingNames:[...a.keys()].filter(n=>!b.has(n)),maxBoundsDeviationPercent:Math.max(...comparisons.map(x=>x.percentOfStationSpan)),mainWingNodes:[...a.keys()].filter(n=>/^(08 P6|20 P4|23 S4|32 S6) Truss_0[12]$/.test(n)),radiatorNodes:[...a.keys()].filter(n=>/^(16 S1|17 P1) Truss_02$/.test(n)),containsPirs:[...a.keys()].some(n=>n.includes('Pirs')),newerComponentNames:[...a.keys()].filter(n=>/Nauka|Prichal|iROSA|Roll.Out/i.test(n)),comparisons}
await writeFile('output/iss-model-audit.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({...report,comparisons:undefined},null,2))
if(report.mainWingNodes.length!==8||report.radiatorNodes.length!==2||report.missingNames.length||report.maxBoundsDeviationPercent>1)process.exitCode=1

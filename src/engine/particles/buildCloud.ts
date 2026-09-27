import {
  NormalBlending, BufferGeometry, Color, DataTexture, Float32BufferAttribute, FloatType,
  LineSegments, Matrix4, NearestFilter, Points, RGBAFormat, ShaderMaterial, Vector2, Vector3,
  type Group, type InstancedMesh, type Material, type Mesh, type MeshStandardMaterial, type Object3D, type Texture,
} from 'three'
import { allocateParticles, chooseTriangle, randomSequence, surfaceTable } from './surface'
import { contourFragment, contourVertex, particleFragment, particleVertex } from './shaders'
import { buildContourGeometry } from './contours'
import { attractorPath, FLOW_SAMPLES } from './attractor'

type SurfaceMaterial = Material & Partial<Pick<MeshStandardMaterial, 'color' | 'map' | 'emissive' | 'emissiveIntensity'>> & { uniforms?: Record<string, { value: unknown }> }
type Source = { mesh: Mesh; instance: number; matrix: Matrix4; table: ReturnType<typeof surfaceTable>; radius: number; weight: number; importance: number; planet: boolean; originalColor?: Color }

function inherited(object: Object3D, key: string): unknown {
  let current: Object3D | null = object
  while (current) {
    if (current.userData[key] !== undefined) return current.userData[key]
    current = current.parent
  }
}

function visible(object: Object3D): boolean {
  let current: Object3D | null = object
  while (current) { if (!current.visible) return false; current = current.parent }
  return true
}

function texturePixels(texture: Texture, cache: Map<Texture, ImageData | null>): ImageData | null {
  if (cache.has(texture)) return cache.get(texture)!
  let pixels: ImageData | null = null
  const source = texture.image as HTMLImageElement | HTMLCanvasElement | undefined
  if (source?.width && source.height) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(1024, source.width)
    canvas.height = Math.max(1, Math.round(canvas.width * source.height / source.width))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    try {
      context?.drawImage(source, 0, 0, canvas.width, canvas.height)
      pixels = context?.getImageData(0, 0, canvas.width, canvas.height) ?? null
    } catch { /* A missing/tainted texture still has a material-color fallback. */ }
  }
  cache.set(texture, pixels)
  return pixels
}

/** One particle batch and one contour batch. Original meshes retain raycasts and animation. */
export function buildCloud(root: Group, budget: number) {
  root.updateWorldMatrix(true, true)
  const sources: Source[] = []
  const suppressed = new Map<Material, boolean>()
  const meshes: Mesh[] = []
  root.traverse(object => {
    const mesh = object as Mesh
    if (!mesh.isMesh || !mesh.geometry?.getAttribute('position')) return
    const mode = inherited(mesh, 'particleMode')
    if (mode === 'background') return
    meshes.push(mesh)
    if (mode === 'hidden') return
    const instanced = mesh as InstancedMesh
    const instances = instanced.isInstancedMesh ? instanced.count : 1
    mesh.geometry.computeBoundingSphere()
    for (let instance = 0; instance < instances; instance++) {
      const matrix = mesh.matrixWorld.clone()
      if (instanced.isInstancedMesh) { const local = new Matrix4(); instanced.getMatrixAt(instance, local); matrix.multiply(local) }
      const radius = (mesh.geometry.boundingSphere?.radius ?? 1) * matrix.getMaxScaleOnAxis()
      const planet = inherited(mesh, 'particleRole') === 'planet'
      const center = new Vector3().setFromMatrixPosition(matrix)
      // Orbit cameras stay near the station. Spend the Earth budget on its
      // visible cap, instead of sampling the unseen far side of a 2,000-unit globe.
      const cap = planet && radius > 100 ? (point: Vector3) => (point.y-center.y)/radius > .84 ? 1 : 0 : undefined
      let table = surfaceTable(mesh.geometry, matrix, cap)
      if (!table.area && instanced.isInstancedMesh) table = surfaceTable(mesh.geometry)
      if (!table.area) continue
      const importance = Number(inherited(mesh, 'particleImportance') ?? 1)
      const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as SurfaceMaterial
      sources.push({ mesh, instance: instanced.isInstancedMesh ? instance : -1, matrix, table, radius, planet, importance, weight: Math.pow(table.area, 0.55), originalColor: material.color?.clone() })
    }
  })
  // Prevent large scenery from consuming the budget of tiny learning targets.
  const ordinary = sources.filter(s => !s.planet).map(s => s.weight).sort((a,b) => a-b)
  const median = ordinary[Math.floor(ordinary.length / 2)] ?? 1
  const planets = sources.filter(s => s.planet).length
  const planetFraction = planets ? (sources.some(s=>s.planet && s.radius>100) ? .45 : .08) : 0
  const counts = allocateParticles(sources.map(s => s.planet ? 0 : Math.min(s.weight, median * 24) * s.importance), Math.round(budget * (1-planetFraction)))
  if (planets) {
    const planetCounts = allocateParticles(sources.map(s => s.planet ? s.radius>100 ? 12 : 1 : 0), budget - counts.reduce((a,b)=>a+b,0))
    counts.forEach((_, i) => { counts[i] += planetCounts[i] })
  }
  const count = counts.reduce((a,b) => a+b, 0)
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), colors = new Float32Array(count * 3)
  const ids = new Float32Array(count), seeds = new Float32Array(count)
  const cache = new Map<Texture, ImageData | null>()
  const rng = randomSequence(600613)
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), n = new Vector3(), p = new Vector3(), uv = new Vector2()
  const base = new Color(), sampled = new Color(), cool = new Color('#8793c5'), warm = new Color('#fff2dc'), planetInk = new Color('#8db6f5')
  let cursor = 0
  sources.forEach((source, objectId) => {
    const geometry = source.mesh.geometry, position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal'), texcoord = geometry.getAttribute('uv'), vertexColor = geometry.getAttribute('color'), index = geometry.index
    for (let i = 0; i < counts[objectId]; i++, cursor++) {
      const offset = chooseTriangle(source.table, rng())
      const ai = index ? index.getX(offset) : offset, bi = index ? index.getX(offset+1) : offset+1, ci = index ? index.getX(offset+2) : offset+2
      const u = Math.sqrt(rng()), v = rng(), wa = 1-u, wb = u*(1-v), wc = u*v
      a.fromBufferAttribute(position, ai); b.fromBufferAttribute(position, bi); c.fromBufferAttribute(position, ci)
      p.copy(a).multiplyScalar(wa).addScaledVector(b,wb).addScaledVector(c,wc)
      p.toArray(positions, cursor*3)
      if (normal) n.fromBufferAttribute(normal,ai).multiplyScalar(wa).addScaledVector(a.fromBufferAttribute(normal,bi),wb).addScaledVector(b.fromBufferAttribute(normal,ci),wc).normalize()
      else n.copy(b).sub(a).cross(c.sub(a)).normalize()
      n.toArray(normals,cursor*3)
      const materials = source.mesh.material
      const material = (Array.isArray(materials) ? materials[geometry.groups.find(g => offset >= g.start && offset < g.start+g.count)?.materialIndex ?? 0] : materials) as SurfaceMaterial
      base.copy(material.color ?? warm)
      const map = material.map ?? material.uniforms?.dayMap?.value as Texture | undefined
      if (map && texcoord) {
        const pixels = texturePixels(map, cache)
        if (pixels) {
          uv.set(texcoord.getX(ai)*wa+texcoord.getX(bi)*wb+texcoord.getX(ci)*wc, texcoord.getY(ai)*wa+texcoord.getY(bi)*wb+texcoord.getY(ci)*wc)
          map.updateMatrix(); map.transformUv(uv)
          const x = Math.min(pixels.width-1, Math.max(0,Math.floor(uv.x*pixels.width))), y = Math.min(pixels.height-1,Math.max(0,Math.floor(uv.y*pixels.height)))
          const k = (y*pixels.width+x)*4
          sampled.setRGB(pixels.data[k]/255,pixels.data[k+1]/255,pixels.data[k+2]/255).convertSRGBToLinear()
          base.multiply(sampled)
        }
      }
      if (vertexColor) base.multiply(sampled.setRGB(vertexColor.getX(ai)*wa+vertexColor.getX(bi)*wb+vertexColor.getX(ci)*wc,vertexColor.getY(ai)*wa+vertexColor.getY(bi)*wb+vertexColor.getY(ci)*wc,vertexColor.getZ(ai)*wa+vertexColor.getZ(bi)*wb+vertexColor.getZ(ci)*wc))
      const light = Math.min(1, Math.sqrt(base.r*.2126+base.g*.7152+base.b*.0722))
      if (source.planet) {
        // Keep continents and lunar albedo legible inside the particle silhouette.
        base.lerp(planetInk, .38).multiplyScalar(.65+light*1.3)
      } else {
        sampled.copy(cool).lerp(warm, light).lerp(base,.22).multiplyScalar(.48+light*.78)
        base.copy(sampled)
      }
      base.toArray(colors,cursor*3)
      ids[cursor] = objectId
      seeds[cursor] = rng()
    }
  })
  cache.clear()
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions,3))
  geometry.setAttribute('surfaceNormal',new Float32BufferAttribute(normals,3))
  geometry.setAttribute('tint',new Float32BufferAttribute(colors,3))
  geometry.setAttribute('objectId',new Float32BufferAttribute(ids,1))
  geometry.setAttribute('seed',new Float32BufferAttribute(seeds,1))
  const rows = Math.max(1,sources.length)
  const matrices = new Float32Array(rows*16), styles = new Float32Array(rows*8)
  const transformTexture = new DataTexture(matrices,4,rows,RGBAFormat,FloatType)
  const styleTexture = new DataTexture(styles,2,rows,RGBAFormat,FloatType)
  const flowTexture = new DataTexture(attractorPath(),FLOW_SAMPLES,1,RGBAFormat,FloatType)
  for (const texture of [transformTexture,styleTexture,flowTexture]) { texture.minFilter = texture.magFilter = NearestFilter; texture.generateMipmaps = false; texture.needsUpdate = true }
  const material = new ShaderMaterial({
    uniforms: { transforms:{value:transformTexture},styles:{value:styleTexture},flowPath:{value:flowTexture},flowSteps:{value:FLOW_SAMPLES},rows:{value:rows},time:{value:0},focus:{value:0},motion:{value:1},pixelRatio:{value:1} },
    vertexShader:particleVertex, fragmentShader:particleFragment,
    transparent:true,depthWrite:true,blending:NormalBlending,toneMapped:true,
  })
  const points = new Points(geometry,material)
  points.name = 'Fluid particle models'
  points.frustumCulled = false
  points.renderOrder = 5
  const contourGeometry = buildContourGeometry(sources, Math.round(budget * .08))
  const contourMaterial = new ShaderMaterial({
    uniforms: material.uniforms,
    vertexShader: contourVertex, fragmentShader: contourFragment,
    transparent: true, depthWrite: false, blending: NormalBlending, toneMapped: true,
  })
  const contours = new LineSegments(contourGeometry, contourMaterial)
  contours.name = 'Stable model contours'
  contours.frustumCulled = false
  contours.renderOrder = 6
  contours.raycast = () => {}
  const instanceMatrix = new Matrix4()
  const synchronize = () => {
    root.updateWorldMatrix(true,true)
    sources.forEach((source,i) => {
      source.matrix.copy(source.mesh.matrixWorld)
      if (source.instance >= 0) { (source.mesh as InstancedMesh).getMatrixAt(source.instance,instanceMatrix); source.matrix.multiply(instanceMatrix) }
      source.matrix.toArray(matrices,i*16)
      const k=i*8
      styles[k] = source.planet ? source.radius * .0025 : Math.min(source.radius*.055,.28)
      styles[k+1] = visible(source.mesh) && source.matrix.getMaxScaleOnAxis() > 1e-8 ? 1 : 0
      styles[k+2] = source.planet ? 1 : 0
      styles[k+3] = source.planet && source.radius>100 ? 1 : 0
      const sourceMaterial = (Array.isArray(source.mesh.material) ? source.mesh.material[0] : source.mesh.material) as SurfaceMaterial
      const changedColor = source.originalColor && sourceMaterial.color && !source.originalColor.equals(sourceMaterial.color) ? sourceMaterial.color : undefined
      const emission = sourceMaterial.emissive && sourceMaterial.emissiveIntensity && sourceMaterial.emissive.getHex() !== 0 && !sourceMaterial.userData.baseEmissive ? sourceMaterial.emissive : undefined
      const highlight = source.mesh.userData.particleHighlight as Color | undefined ?? changedColor ?? emission
      styles[k+4] = highlight?.r ?? 0; styles[k+5] = highlight?.g ?? 0; styles[k+6] = highlight?.b ?? 0
      styles[k+7] = highlight ? .92 : 0
    })
    transformTexture.needsUpdate = styleTexture.needsUpdate = true
  }
  // All animation callbacks have run by onBeforeRender, including robot joints.
  // The same world transforms also serve auxiliary cameras and photo capture.
  points.onBeforeRender = renderer => {
    synchronize()
    material.uniforms.pixelRatio.value = Math.min(renderer.getPixelRatio(),1.75)
  }
  for (const mesh of meshes) {
    for (const original of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (!suppressed.has(original)) suppressed.set(original,original.visible)
      original.visible = false
    }
  }
  synchronize()
  // Sampling tables are CPU-only build data. Release them after upload creation.
  sources.forEach(source => { source.table.triangles.length = source.table.cumulative.length = 0 })
  return {
    points, contours, material, count, sources,
    dispose() {
      suppressed.forEach((wasVisible,original) => { original.visible = wasVisible })
      geometry.dispose(); material.dispose(); transformTexture.dispose(); styleTexture.dispose(); flowTexture.dispose()
      contourGeometry.dispose(); contourMaterial.dispose()
    },
  }
}

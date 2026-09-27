import { tr } from '../../i18n/tr'
import { Box3, BufferGeometry, Color, EdgesGeometry, Float32BufferAttribute, Matrix3, Matrix4, Vector3, type Mesh } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { allocateParticles, chooseTriangle, randomSequence, surfaceTable } from '../../engine/particles/surface'
import { ISS_PARTS, normalizeIssName } from '../issParts'

export const STATION_FRACTION = .72
export const STATION_PARTS = Object.keys(ISS_PARTS) as (keyof typeof ISS_PARTS)[]
export const STATION_PALETTE = [
  { id: 'solar', color: '#c89a50', label: tr("太陽電池"), share: .35 },
  { id: 'module', color: '#cbdce6', label: tr("居住・実験区画"), share: .34 },
  { id: 'truss', color: '#58a6be', label: tr("トラス"), share: .15 },
  { id: 'radiator', color: '#889cc9', label: tr("放熱板"), share: .08 },
  { id: 'robot', color: '#87cbb9', label: tr("ロボットアーム"), share: .05 },
  { id: 'equipment', color: '#647c93', label: tr("外部機器"), share: .03 },
] as const

export function stationCategory(name: string) {
  const n = normalizeIssName(name)
  if (ISS_PARTS.solar.match.test(n)) return 0
  if (ISS_PARTS.radiators.match.test(n)) return 3
  if (ISS_PARTS.truss.match.test(n)) return 2
  if (/Canadarm|DEXTRE|Robotic Arm|\(MBS\)/.test(n)) return 4
  if (/Zarya|Unity|Zvezda|Destiny|Quest|Harmony|Tranquility|Columbus|Kibo|Cupola|Leonardo|Pirs|Poisk|Rassvet|\(PMA\)/.test(n)) return 1
  return 5
}

/** A separate ISS drawing: area-balanced surfaces, dotted structural edges,
 * and one invisible depth mesh. Nothing is moved or invented in the NASA asset. */
export function buildStationGeometry(meshes: Mesh[], budget: number, localFromWorld = new Matrix4()) {
  const rng = randomSequence(20260926)
  const sources = meshes.map(mesh => {
    const matrix = new Matrix4().multiplyMatrices(localFromWorld, mesh.matrixWorld)
    const name = mesh.userData.part || normalizeIssName(mesh.name)
    const category = stationCategory(name)
    const part = STATION_PARTS.findIndex(key => ISS_PARTS[key].match.test(name))
    return { mesh, matrix, normalMatrix: new Matrix3().getNormalMatrix(matrix), category, part, table: surfaceTable(mesh.geometry, matrix) }
  }).filter(s => s.table.area > 0)
  const categoryCounts = allocateParticles(STATION_PALETTE.map((p, i) => sources.some(s => s.category === i) ? p.share : 0), budget)
  const counts = sources.map(() => 0)
  STATION_PALETTE.forEach((_, category) => {
    const share = allocateParticles(sources.map(s => s.category === category ? Math.pow(s.table.area, .82) : 0), categoryCounts[category])
    share.forEach((n, i) => { counts[i] += n })
  })

  const positions: number[] = [], normals: number[] = [], colors: number[] = [], properties: number[] = []
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), p = new Vector3(), n = new Vector3()
  const tint = STATION_PALETTE.map(s => new Color(s.color))
  const masks: BufferGeometry[] = []
  const put = (source: typeof sources[number], edge: number, cell = 1) => {
    positions.push(p.x, p.y, p.z); normals.push(n.x, n.y, n.z)
    const color = tint[source.category]
    const value = edge ? 1.2 : cell * (.88 + rng() * .18)
    colors.push(color.r * value, color.g * value, color.b * value)
    properties.push(rng(), edge, source.part, source.category)
  }

  sources.forEach((source, sourceIndex) => {
    const geo = source.mesh.geometry, pos = geo.getAttribute('position'), normal = geo.getAttribute('normal'), index = geo.index
    // Occlude the solid modules/truss, not the thin double-sided blankets.
    // A solid mask on coincident blanket layers can erase an entire array.
    if (source.category !== 0 && source.category !== 3) {
      const mask = new BufferGeometry()
      mask.setAttribute('position', pos.clone())
      mask.setIndex(index ? index.clone() : Array.from({ length: pos.count }, (_, i) => i))
      mask.applyMatrix4(source.matrix); masks.push(mask)
    }

    const outlineCount = Math.floor(counts[sourceIndex] * (source.category === 2 ? .38 : .22))
    const edges = new EdgesGeometry(geo, 34)
    const ep = edges.getAttribute('position')
    const edgeList: { offset: number; length: number }[] = []
    for (let j = 0; j + 1 < ep.count; j += 2) {
      a.fromBufferAttribute(ep, j).applyMatrix4(source.matrix); b.fromBufferAttribute(ep, j + 1).applyMatrix4(source.matrix)
      const length = a.distanceTo(b)
      if (length > .0018) edgeList.push({ offset: j, length })
    }
    const edgeCounts = allocateParticles(edgeList.map(e => Math.pow(e.length, 1.15)), outlineCount)
    const emittedEdges = edgeCounts.reduce((sum, v) => sum + v, 0)
    edgeList.forEach((edge, j) => {
      a.fromBufferAttribute(ep, edge.offset).applyMatrix4(source.matrix); b.fromBufferAttribute(ep, edge.offset + 1).applyMatrix4(source.matrix)
      n.set(0, 0, 0)
      for (let k = 0; k < edgeCounts[j]; k++) { p.lerpVectors(a, b, (k + .5) / edgeCounts[j]); put(source, 1) }
    })
    edges.dispose()

    const bounds = new Box3().setFromBufferAttribute(pos as Float32BufferAttribute)
    const extents = bounds.getSize(new Vector3()).toArray()
    const axes = [0, 1, 2].sort((x, y) => extents[y] - extents[x])
    const surfaceCount = counts[sourceIndex] - emittedEdges
    for (let i = 0; i < surfaceCount; i++) {
      // Stratified triangle selection avoids accidental clumps on broad arrays.
      const tri = chooseTriangle(source.table, (i + rng()) / surfaceCount)
      const ai = index ? index.getX(tri) : tri, bi = index ? index.getX(tri + 1) : tri + 1, ci = index ? index.getX(tri + 2) : tri + 2
      const u = Math.sqrt(rng()), v = rng(), wa = 1 - u, wb = u * (1 - v), wc = u * v
      a.fromBufferAttribute(pos, ai); b.fromBufferAttribute(pos, bi); c.fromBufferAttribute(pos, ci)
      p.copy(a).multiplyScalar(wa).addScaledVector(b, wb).addScaledVector(c, wc)
      let cell = 1
      if (source.category === 0) {
        const row = (p.getComponent(axes[0]) - bounds.min.getComponent(axes[0])) / Math.max(.0001, extents[axes[0]])
        const col = (p.getComponent(axes[1]) - bounds.min.getComponent(axes[1])) / Math.max(.0001, extents[axes[1]])
        // Fine cell divisions are a visual guide, not a physical cell count.
        cell = (row * 48 % 1 < .13 || col * 8 % 1 < .1) ? .34 : 1
      }
      if (normal) n.fromBufferAttribute(normal, ai).multiplyScalar(wa).addScaledVector(a.fromBufferAttribute(normal, bi), wb).addScaledVector(b.fromBufferAttribute(normal, ci), wc).normalize()
      else n.subVectors(b, a).cross(c.sub(a)).normalize()
      p.applyMatrix4(source.matrix); n.applyNormalMatrix(source.normalMatrix)
      put(source, 0, cell)
    }
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('stationData', new Float32BufferAttribute(properties, 4))
  geometry.computeBoundingSphere()
  const depthGeometry = mergeGeometries(masks) ?? new BufferGeometry()
  masks.forEach(mask => mask.dispose())
  return { geometry, depthGeometry, count: positions.length / 3, categoryCounts, dispose: () => { geometry.dispose(); depthGeometry.dispose() } }
}

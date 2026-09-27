import { BufferGeometry, EdgesGeometry, Float32BufferAttribute, Vector3, type Matrix4, type Mesh } from 'three'

interface ContourSource {
  mesh: Mesh
  matrix: Matrix4
  radius: number
  importance: number
  planet: boolean
}

/** Keep structural edges in model space so they follow the same GPU transforms as the particles. */
export function buildContourGeometry(sources: ContourSource[], maxSegments: number) {
  const cache = new Map<BufferGeometry, EdgesGeometry>()
  const candidates: { position: EdgesGeometry['attributes']['position']; offset: number; objectId: number; score: number }[] = []
  const a = new Vector3(), b = new Vector3()
  sources.forEach((source, objectId) => {
    // Smooth planets use the view-dependent particle rim. Ambient bubbles need no frame.
    if (source.planet || source.importance < .1) return
    let edges = cache.get(source.mesh.geometry)
    if (!edges) {
      edges = new EdgesGeometry(source.mesh.geometry, 38)
      cache.set(source.mesh.geometry, edges)
    }
    const position = edges.getAttribute('position')
    for (let offset = 0; offset + 1 < position.count; offset += 2) {
      a.fromBufferAttribute(position, offset).applyMatrix4(source.matrix)
      b.fromBufferAttribute(position, offset + 1).applyMatrix4(source.matrix)
      const length = a.distanceTo(b)
      if (!Number.isFinite(length) || length < Math.max(1e-7, source.radius * .006)) continue
      candidates.push({ position, offset, objectId, score: length * Math.sqrt(source.importance) })
    }
  })
  // Cap complexity on phones. Long boundary edges take priority over tiny fittings.
  if (candidates.length > maxSegments) {
    candidates.sort((a,b) => b.score - a.score)
    candidates.length = Math.max(0, Math.floor(maxSegments))
  }
  const vertices = new Float32Array(candidates.length * 6)
  const ids = new Float32Array(candidates.length * 2)
  candidates.forEach(({ position, offset, objectId }, i) => {
    a.fromBufferAttribute(position, offset).toArray(vertices, i * 6)
    b.fromBufferAttribute(position, offset + 1).toArray(vertices, i * 6 + 3)
    ids[i * 2] = ids[i * 2 + 1] = objectId
  })
  cache.forEach(edges => edges.dispose())
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('objectId', new Float32BufferAttribute(ids, 1))
  return geometry
}

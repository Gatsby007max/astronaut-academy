import { Vector3, type BufferGeometry, type Matrix4 } from 'three'

/** Surface area, not vertex density, determines where particles are placed. */
export function surfaceTable(geometry: BufferGeometry, transform?: Matrix4, weightAt?: (center: Vector3) => number) {
  const position = geometry.getAttribute('position')
  const index = geometry.index
  const end = Math.min(index?.count ?? position.count, geometry.drawRange.start + geometry.drawRange.count)
  const triangles: number[] = [], cumulative: number[] = []
  const a = new Vector3(), b = new Vector3(), c = new Vector3()
  const center = new Vector3()
  let area = 0
  for (let offset = geometry.drawRange.start; offset + 2 < end; offset += 3) {
    a.fromBufferAttribute(position, index ? index.getX(offset) : offset)
    b.fromBufferAttribute(position, index ? index.getX(offset + 1) : offset + 1)
    c.fromBufferAttribute(position, index ? index.getX(offset + 2) : offset + 2)
    if (transform) { a.applyMatrix4(transform); b.applyMatrix4(transform); c.applyMatrix4(transform) }
    const importance = weightAt ? weightAt(center.copy(a).add(b).add(c).multiplyScalar(1/3)) : 1
    const weight = b.sub(a).cross(c.sub(a)).length() * 0.5 * importance
    if (!Number.isFinite(weight) || weight <= 0) continue
    area += weight
    triangles.push(offset)
    cumulative.push(area)
  }
  return { triangles, cumulative, area }
}

export function chooseTriangle(table: ReturnType<typeof surfaceTable>, fraction: number) {
  const target = fraction * table.area
  let lo = 0, hi = table.cumulative.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (target < table.cumulative[mid]) hi = mid
    else lo = mid + 1
  }
  return table.triangles[lo]
}

export function randomSequence(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

/** Exact budget, including tiny parts; no rounding overflow on complex models. */
export function allocateParticles(weights: number[], budget: number): number[] {
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0)
  if (!total) return weights.map(() => 0)
  let used = 0, accumulated = 0
  return weights.map(weight => {
    accumulated += Math.max(0, weight)
    const end = Math.round(accumulated / total * budget)
    const count = end - used
    used = end
    return count
  })
}

export const PARTICLE_BUDGET = { low: 70000, medium: 115000, high: 180000, ultra: 240000 } as const
export const FLOW_FRACTION = 0.38

export function examParticles(screen: { name: string; phase?: string }): boolean {
  return screen.name === 'module' && (screen.phase === 'quiz' || screen.phase === 'mini')
}

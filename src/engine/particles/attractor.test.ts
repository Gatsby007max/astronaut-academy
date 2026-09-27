import { describe, expect, it } from 'vitest'
import { advanceAttractor, createAttractorPath, FLOW_SAMPLES } from './attractor'

describe('double-vortex flow', () => {
  it('produces a repeatable, bounded trajectory spanning both lobes', () => {
    const path = createAttractorPath()
    expect(path).toHaveLength(FLOW_SAMPLES * 4)
    expect(path).toEqual(createAttractorPath())
    let left = 0, right = 0, crossings = 0
    for (let i = 0; i < FLOW_SAMPLES; i++) {
      const [x, y, z, w] = path.slice(i * 4, i * 4 + 4)
      expect([x, y, z, w].every(Number.isFinite)).toBe(true)
      expect(Math.abs(x)).toBeLessThan(1.5)
      expect(Math.abs(y)).toBeLessThan(0.85)
      expect(Math.abs(z)).toBeLessThan(0.85)
      expect(w).toBe(1)
      if (x < -0.2) left++
      if (x > 0.2) right++
      if (i && x * path[(i - 1) * 4] < 0) crossings++
    }
    expect(left).toBeGreaterThan(FLOW_SAMPLES * 0.2)
    expect(right).toBeGreaterThan(FLOW_SAMPLES * 0.2)
    expect(crossings).toBeGreaterThan(5)
  })

  it('stays numerically stable with small continuous integration steps', () => {
    let p: [number, number, number] = [0.1, 0, 0.1]
    for (let i = 0; i < 12000; i++) {
      const next = advanceAttractor(p)
      expect(next.every(value => Number.isFinite(value) && Math.abs(value) < 60)).toBe(true)
      expect(Math.hypot(...next.map((value, axis) => value - p[axis]))).toBeLessThan(6)
      p = next
    }
  })
})

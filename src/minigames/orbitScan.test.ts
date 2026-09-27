import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_SCORE_PER_PROMPT, PROMPTS_PER_RUN, scoreForPick, useOrbitScan } from './orbitScan'

describe('orbit scan scoring', () => {
  it('rewards fast correct picks and penalizes misses', () => {
    expect(scoreForPick(true, 1)).toBe(MAX_SCORE_PER_PROMPT)
    expect(scoreForPick(true, 30)).toBe(100)
    expect(scoreForPick(false, 1)).toBeLessThan(0)
  })

  describe('run', () => {
    const visible = Object.fromEntries(['solar', 'radiators', 'cupola', 'destiny', 'canadarm2', 'terminator', 'night'].map((id) => [id, [0, 0, 0] as [number, number, number]]))
    beforeEach(() => useOrbitScan.getState().reset())

    it('only asks about visible targets and finishes after all prompts', () => {
      const s = useOrbitScan.getState()
      s.arm()
      s.begin(visible)
      const { order } = useOrbitScan.getState()
      expect(order).toHaveLength(PROMPTS_PER_RUN)
      for (const id of order) expect(Object.keys(visible)).toContain(id)
      for (const id of order) expect(useOrbitScan.getState().pick(id)).toBe(true)
      expect(useOrbitScan.getState().status).toBe('done')
      expect(useOrbitScan.getState().score).toBeGreaterThanOrEqual(PROMPTS_PER_RUN * 100)
    })

    it('does not advance on a wrong pick', () => {
      const s = useOrbitScan.getState()
      s.arm()
      s.begin(visible)
      const wrong = Object.keys(visible).find((id) => id !== useOrbitScan.getState().order[0])!
      expect(useOrbitScan.getState().pick(wrong)).toBe(false)
      expect(useOrbitScan.getState().index).toBe(0)
      expect(useOrbitScan.getState().mistakes).toBe(1)
    })
  })
})

import { describe, expect, it } from 'vitest'
import { emptyLoadout, isTrimmed, minimumMoves, randomTrim, STEP_KG, trimFor, weighOutScore } from './buoyancy'
import { pickScenarios, PREBREATHE_ROUNDS, prebreatheScore, SCENARIOS } from './prebreathe'

describe('weigh-out', () => {
  it('adding weight reduces buoyancy and tilts toward the mount', () => {
    const initial = { buoyancy: 3, pitch: 0, roll: 0 }
    const t = trimFor(initial, { ...emptyLoadout(), front: 2, right: -1 })
    expect(t.buoyancy).toBeCloseTo(3 - 2 * STEP_KG + STEP_KG)
    expect(t.pitch).toBeCloseTo(2 * STEP_KG)
    expect(t.roll).toBeCloseTo(-STEP_KG)
  })

  it('always generates puzzles that can be trimmed exactly', () => {
    let seed = 1
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < 200; i++) {
      const initial = randomTrim(random)
      expect(Number.isInteger(initial.buoyancy - initial.pitch - initial.roll)).toBe(true)
      expect(Number.isFinite(minimumMoves(initial))).toBe(true)
    }
  })

  it('recognises a neutral trim', () => {
    const initial = { buoyancy: 2, pitch: 1, roll: 0 }
    expect(isTrimmed(trimFor(initial, emptyLoadout()))).toBe(false)
    expect(isTrimmed(trimFor(initial, { front: 0, back: 2, left: 1, right: 1 }))).toBe(true)
  })

  it('scores fast minimal solutions highest', () => {
    expect(weighOutScore(0, 10, 0)).toBe(600)
    expect(weighOutScore(4, 40, 1)).toBeLessThan(600)
    expect(weighOutScore(100, 500, 10)).toBe(0)
  })
})

describe('prebreathe', () => {
  it('picks distinct scenarios whose answers exist among the options', () => {
    const picked = pickScenarios()
    expect(picked).toHaveLength(PREBREATHE_ROUNDS)
    expect(new Set(picked.map((s) => s.id)).size).toBe(PREBREATHE_ROUNDS)
    for (const s of SCENARIOS) expect(s.options.map((o) => o.id)).toContain(s.answer)
  })

  it('awards partial credit for second attempts', () => {
    expect(prebreatheScore(4, 0)).toBe(400)
    expect(prebreatheScore(2, 2)).toBe(280)
  })
})

import { tr } from '../i18n/tr'
import { create } from 'zustand'

export type Mount = 'front' | 'back' | 'left' | 'right'
export const MOUNTS: { id: Mount; label: string; hint: string }[] = [
  { id: 'front', label: tr("胸部前面"), hint: tr("前傾（ピッチ）に効く") },
  { id: 'back', label: tr("背面（PLSS）"), hint: tr("後傾（ピッチ）に効く") },
  { id: 'left', label: tr("左脚"), hint: tr("左右の傾き（ロール）に効く") },
  { id: 'right', label: tr("右脚"), hint: tr("左右の傾き（ロール）に効く") },
]

export const STEP_KG = 0.5
export const TOLERANCE = 0.25

export interface Trim {
  buoyancy: number
  pitch: number
  roll: number
}

export type Loadout = Record<Mount, number>

export const emptyLoadout = (): Loadout => ({ front: 0, back: 0, left: 0, right: 0 })

export function trimFor(initial: Trim, loadout: Loadout): Trim {
  const d = (m: Mount) => loadout[m] * STEP_KG
  return {
    buoyancy: initial.buoyancy - (d('front') + d('back') + d('left') + d('right')),
    pitch: initial.pitch + d('front') - d('back'),
    roll: initial.roll + d('right') - d('left'),
  }
}

export function isTrimmed(t: Trim): boolean {
  return Math.abs(t.buoyancy) <= TOLERANCE && Math.abs(t.pitch) <= TOLERANCE && Math.abs(t.roll) <= TOLERANCE
}

export function minimumMoves(initial: Trim): number {
  let best = Infinity
  const range = 16
  for (let front = -range; front <= range; front++) {
    for (let back = -range; back <= range; back++) {
      const pitch = initial.pitch + (front - back) * STEP_KG
      if (Math.abs(pitch) > TOLERANCE) continue
      const remaining = initial.buoyancy - (front + back) * STEP_KG
      for (let left = -range; left <= range; left++) {
        const right = Math.round(remaining / STEP_KG - left)
        const t = trimFor(initial, { front, back, left, right })
        if (!isTrimmed(t)) continue
        best = Math.min(best, Math.abs(front) + Math.abs(back) + Math.abs(left) + Math.abs(right))
      }
    }
  }
  return best
}

export function randomTrim(random = Math.random): Trim {
  const half = (min: number, max: number) => Math.round((min + random() * (max - min)) / STEP_KG) * STEP_KG
  const buoyancy = half(2.5, 5)
  const pitch = half(-1.5, 1.5)
  let roll = half(-1.5, 1.5)
  if (!Number.isInteger(buoyancy - pitch - roll)) roll += roll > 0 ? -STEP_KG : STEP_KG
  return { buoyancy, pitch, roll }
}

export function weighOutScore(extraMoves: number, seconds: number, failedChecks: number): number {
  const penalty = extraMoves * 15 + Math.max(0, seconds - 25) * 4 + failedChecks * 80
  return Math.max(0, Math.round(600 - penalty))
}

interface BuoyancyState {
  initial: Trim
  loadout: Loadout
  moves: number
  failedChecks: number
  startedAt: number
  finishedAt?: number
  optimal: number
  adjust: (mount: Mount, delta: 1 | -1) => void
  check: () => boolean
  reset: () => void
}

function fresh() {
  const initial = randomTrim()
  return { initial, loadout: emptyLoadout(), moves: 0, failedChecks: 0, startedAt: performance.now(), finishedAt: undefined, optimal: minimumMoves(initial) }
}

export const useBuoyancy = create<BuoyancyState>()((set, get) => ({
  ...fresh(),
  adjust: (mount, delta) => {
    if (get().finishedAt) return
    set((s) => ({ loadout: { ...s.loadout, [mount]: s.loadout[mount] + delta }, moves: s.moves + 1 }))
  },
  check: () => {
    const s = get()
    const ok = isTrimmed(trimFor(s.initial, s.loadout))
    if (ok) set({ finishedAt: performance.now() })
    else set({ failedChecks: s.failedChecks + 1 })
    return ok
  },
  reset: () => set(fresh()),
}))

export function currentWeighOutScore(s: Pick<BuoyancyState, 'moves' | 'optimal' | 'failedChecks' | 'startedAt' | 'finishedAt'>): number {
  const seconds = ((s.finishedAt ?? performance.now()) - s.startedAt) / 1000
  return weighOutScore(Math.max(0, s.moves - s.optimal), seconds, s.failedChecks)
}

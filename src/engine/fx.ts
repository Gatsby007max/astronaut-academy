import { create } from 'zustand'

export interface FxState {
  bloomIntensity: number
  bloomThreshold: number
  bloomSmoothing: number
  vignette: number
  noise: number
  chroma: number
  exposure: number
  dofFocus: number
  dofRange: number
  dofBokeh: number
  dofEnabled: boolean
  set: (patch: Partial<Omit<FxState, 'set' | 'reset'>>) => void
  reset: () => void
}

const defaults = {
  bloomIntensity: 0.9,
  bloomThreshold: 0.72,
  bloomSmoothing: 0.25,
  vignette: 0.55,
  noise: 0.035,
  chroma: 0,
  exposure: 1,
  dofFocus: 8,
  dofRange: 6,
  dofBokeh: 3,
  dofEnabled: false,
}

export const useFx = create<FxState>()((set) => ({
  ...defaults,
  set: (patch) => set(patch),
  reset: () => set(defaults),
}))

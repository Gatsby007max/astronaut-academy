import { create } from 'zustand'

interface UiState {
  viewShift: { x: number; y: number }
  sceneReady: boolean
  caption?: { title: string; subtitle?: string }
  setViewShift: (x: number, y: number) => void
  setSceneReady: (ready: boolean) => void
  setCaption: (caption?: { title: string; subtitle?: string }) => void
}

export const useUi = create<UiState>()((set) => ({
  viewShift: { x: 0, y: 0 },
  sceneReady: false,
  setViewShift: (x, y) => set({ viewShift: { x, y } }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setCaption: (caption) => set({ caption }),
}))

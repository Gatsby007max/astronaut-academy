import { create } from 'zustand'
export const usePractice = create<{
 active: string; selected: string; event: string; progress: number; set: (p: Partial<{ active: string; selected: string; event: string; progress: number }>) => void
}>()(set => ({ active: '', selected: '', event: '', progress: 0, set }))

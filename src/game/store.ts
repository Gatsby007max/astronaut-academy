import { tr, trt } from '../i18n/tr'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MODULE_BY_ID } from '../content/modules'
import type { Locale, ModuleId } from '../content/types'
import { detectInitialTier, type QualitySetting, type QualityTier } from '../engine/quality'
import {
  isUnlocked,
  completedCount,
  awardLesson,
  awardMini,
  awardQuiz,
  emptyProgress,
  rankFor,
  updateReview,
  type Award,
  type ModuleProgress,
  type ProgressMap,
  type QuizAnswer,
} from './progress'

export type ModulePhase = 'brief' | 'quiz' | 'mini' | 'result'

export type Screen =
  | { name: 'title' }
  | { name: 'intro' }
  | { name: 'hub' }
  | { name: 'module'; id: ModuleId; phase: ModulePhase }
  | { name: 'review' }
  | { name: 'credits' }
  | { name: 'graduation' }

export interface Toast {
  id: number
  kind: 'xp' | 'badge' | 'rank' | 'info'
  title: string
  detail?: string
}

export interface Settings {
  locale: Locale
  quality: QualitySetting
  particleMotion: boolean
  audio: boolean
  volume: number
}

interface PersistedState {
  xp: number
  modules: ProgressMap
  review: string[]
  introSeen: boolean
  graduated: boolean
  settings: Settings
}

interface SessionState {
  debugMode: boolean
  screen: Screen
  tier: QualityTier
  focus: string
  lessonIndex: number
  toasts: Toast[]
  lastResult?: { moduleId: ModuleId; kind: 'quiz' | 'mini'; score: number; award: Award; sample?: boolean }
}

interface Actions {
  setDebugMode: (enabled: boolean) => void
  previewResult: (id: ModuleId, score?: number) => void
  go: (screen: Screen) => void
  openModule: (id: ModuleId, phase?: ModulePhase) => void
  setPhase: (phase: ModulePhase) => void
  setFocus: (focus: string) => void
  setLessonIndex: (index: number) => void
  setTier: (tier: QualityTier) => void
  updateSettings: (patch: Partial<Settings>) => void
  markLessonRead: (id: ModuleId, lessonId: string) => void
  recordQuiz: (id: ModuleId, answers: QuizAnswer[]) => number
  recordReview: (answers: QuizAnswer[]) => void
  recordMini: (id: ModuleId, score: number) => void
  finishIntro: () => void
  graduate: () => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  resetProgress: () => void
}

export type GameState = PersistedState & SessionState & Actions

let toastId = 0

const initialPersisted = (): PersistedState => ({
  xp: 0,
  modules: {},
  review: [],
  introSeen: false,
  graduated: false,
  settings: { locale: 'ja', quality: 'auto', particleMotion: true, audio: true, volume: 0.7 },
})

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const initialDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'
      const grant = (award: Award) => {
        if (award.xp <= 0) return
        const before = rankFor(get().xp, get().graduated)
        set((s) => ({ xp: s.xp + award.xp }))
        get().pushToast({ kind: 'xp', title: `+${award.xp} XP`, detail: award.reasons.join(' / ') })
        const after = rankFor(get().xp, get().graduated)
        if (after.id !== before.id) get().pushToast({ kind: 'rank', title: trt`昇格: ${after.title}`, detail: after.en })
      }

      const updateModule = (id: ModuleId, next: ModuleProgress) => {
        const prev = get().modules[id]
        set((s) => ({ modules: { ...s.modules, [id]: next } }))
        if (next.completed && !prev?.completed) {
          const badge = MODULE_BY_ID[id].badge
          get().pushToast({ kind: 'badge', title: trt`バッジ獲得: ${badge.name}`, detail: badge.description })
        }
      }

      return {
        ...initialPersisted(),
        debugMode: initialDebug,
        screen: { name: initialDebug ? 'hub' : 'title' },
        tier: detectInitialTier(),
        focus: 'overview',
        lessonIndex: 0,
        toasts: [],

        setDebugMode: (enabled) => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            if (enabled) url.searchParams.set('debug', '1')
            else url.searchParams.delete('debug')
            window.history.replaceState(window.history.state, '', url)
          }
          // Leave the current exercise so a preview cannot be submitted after returning to normal mode.
          set({ debugMode: enabled, screen: { name: 'hub' }, focus: 'overview', lessonIndex: 0, lastResult: undefined, toasts: [] })
        },
        previewResult: (id, score = 1000) => {
          if (!get().debugMode) return
          set({
            screen: { name: 'module', id, phase: 'result' }, focus: 'overview', lessonIndex: 0,
            lastResult: { moduleId: id, kind: 'mini', score, award: { xp: 0, reasons: [] }, sample: true },
          })
        },
        go: (screen) => set({ screen, focus: 'overview', lessonIndex: 0 }),
        openModule: (id, phase = 'brief') => {
          if (!isUnlocked(id, get().modules, get().debugMode)) return
          set({ screen: { name: 'module', id, phase }, focus: 'overview', lessonIndex: 0, lastResult: undefined })
        },
        setPhase: (phase) => {
          const screen = get().screen
          if (screen.name === 'module') set({ screen: { ...screen, phase }, focus: 'overview' })
        },
        setFocus: (focus) => set({ focus }),
        setLessonIndex: (lessonIndex) => set({ lessonIndex }),
        setTier: (tier) => set({ tier }),
        updateSettings: (patch) =>
          set((s) => {
            const settings = { ...s.settings, ...patch }
            const tier = patch.quality && patch.quality !== 'auto' ? patch.quality : s.tier
            return { settings, tier }
          }),

        markLessonRead: (id, lessonId) => {
          if (get().debugMode) return
          const { progress, award } = awardLesson(get().modules[id] ?? emptyProgress(), lessonId)
          if (award.xp === 0) return
          updateModule(id, progress)
          grant(award)
        },

        recordQuiz: (id, answers) => {
          const { progress, award, score } = awardQuiz(get().modules[id] ?? emptyProgress(), answers)
          if (get().debugMode) {
            set({ lastResult: { moduleId: id, kind: 'quiz', score, award: { xp: 0, reasons: [] } } })
            return score
          }
          updateModule(id, progress)
          set((s) => ({ review: updateReview(s.review, answers), lastResult: { moduleId: id, kind: 'quiz', score, award } }))
          grant(award)
          return score
        },

        recordReview: (answers) => {
          if (!get().debugMode) set((s) => ({ review: updateReview(s.review, answers) }))
        },

        recordMini: (id, score) => {
          if (get().debugMode) {
            set({ lastResult: { moduleId: id, kind: 'mini', score, award: { xp: 0, reasons: [] } } })
            return
          }
          const { progress, award } = awardMini(get().modules[id] ?? emptyProgress(), score)
          updateModule(id, progress)
          set({ lastResult: { moduleId: id, kind: 'mini', score, award } })
          grant(award)
        },

        finishIntro: () => set({ introSeen: get().debugMode ? get().introSeen : true, screen: { name: 'hub' } }),
        graduate: () => {
          if (get().debugMode) {
            set({ screen: { name: 'graduation' } })
            return
          }
          if (completedCount(get().modules) !== 9) return
          set({ graduated: true, screen: { name: 'graduation' } })
          get().pushToast({ kind: 'rank', title: tr("昇格: 搭乗資格者"), detail: 'FLIGHT ELIGIBLE' })
        },

        pushToast: (toast) => {
          const id = ++toastId
          set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }))
          setTimeout(() => get().dismissToast(id), toast.kind === 'xp' ? 2600 : 4800)
        },
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        resetProgress: () => {
          if (get().debugMode) return
          set({ ...initialPersisted(), settings: get().settings, screen: { name: 'title' }, focus: 'overview', lessonIndex: 0, lastResult: undefined, toasts: [] })
        },
      }
    },
    {
      name: 'astronaut-academy-v1',
      partialize: (s): PersistedState => ({
        xp: s.xp,
        modules: s.modules,
        review: s.review,
        introSeen: s.introSeen,
        graduated: s.graduated,
        settings: s.settings,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<PersistedState> | undefined
        const merged = { ...current, ...p, settings: { ...current.settings, ...p?.settings } }
        if (merged.settings.quality !== 'auto') merged.tier = merged.settings.quality
        return merged
      },
    },
  ),
)

export const activeModuleId = (s: GameState): ModuleId | undefined => (s.screen.name === 'module' ? s.screen.id : undefined)

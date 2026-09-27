import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MODULES } from '../content/modules'
import { emptyProgress, isUnlocked, XP } from './progress'

const STORAGE_KEY = 'astronaut-academy-v1'
let useGame: typeof import('./store').useGame
let saved: Map<string, string>
let location: URL

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  saved = new Map()
  location = new URL('http://localhost:5181/?quality=low#training')
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
    removeItem: (key: string) => saved.delete(key),
  })
  vi.stubGlobal('window', {
    location,
    localStorage: globalThis.localStorage,
    history: { state: null, replaceState: vi.fn((_state: unknown, _title: string, next: URL) => { location.href = String(next) }) },
  })
  ;({ useGame } = await import('./store'))
  useGame.setState({
    xp: XP.lesson,
    modules: { orientation: { ...emptyProgress(), lessonsRead: ['orientation-l01'] } },
    review: ['orientation-q01'],
  })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('debug access and progress isolation', () => {
  it('opens every module only while debug mode is on, then restores normal gates', () => {
    useGame.getState().openModule('mcc')
    expect(useGame.getState().screen).toEqual({ name: 'title' })
    useGame.getState().setDebugMode(true)
    for (const module of MODULES) {
      expect(isUnlocked(module.id, {}, true)).toBe(true)
      useGame.getState().openModule(module.id, 'mini')
      expect(useGame.getState().screen).toEqual({ name: 'module', id: module.id, phase: 'mini' })
    }
    useGame.getState().setDebugMode(false)
    useGame.getState().openModule('mcc')
    expect(useGame.getState().screen).toEqual({ name: 'hub' })
    expect(isUnlocked('mcc', useGame.getState().modules)).toBe(false)
  })

  it('keeps all persisted progress unchanged across preview actions, including reset', () => {
    const before = saved.get(STORAGE_KEY)
    const original = useGame.getState().modules
    const state = () => useGame.getState()
    state().setDebugMode(true)
    state().markLessonRead('lunar', 'lunar-l10')
    const score = state().recordQuiz('lunar', [
      { questionId: 'lunar-q01', correct: true }, { questionId: 'lunar-q02', correct: false },
    ])
    expect(score).toBe(0.5)
    expect(state().lastResult?.award.xp).toBe(0)
    state().recordMini('mcc', 1000)
    expect(state().lastResult).toMatchObject({ kind: 'mini', score: 1000, award: { xp: 0 } })
    state().recordReview([{ questionId: 'orientation-q01', correct: true }])
    state().finishIntro()
    state().graduate()
    expect(state().screen).toEqual({ name: 'graduation' })
    state().resetProgress()
    state().previewResult('mcc', 400)
    expect(state().lastResult).toMatchObject({ score: 400, sample: true, award: { xp: 0 } })
    expect(state().modules).toBe(original)
    expect(saved.get(STORAGE_KEY)).toBe(before)
    expect(state().introSeen).toBe(false)
    expect(state().graduated).toBe(false)
  })

  it('clears the active preview on exit and allows genuine learning to save again', () => {
    useGame.getState().setDebugMode(true)
    useGame.getState().previewResult('mcc')
    useGame.getState().setLessonIndex(9)
    useGame.getState().setDebugMode(false)
    expect(useGame.getState()).toMatchObject({ debugMode: false, screen: { name: 'hub' }, lastResult: undefined, lessonIndex: 0 })
    useGame.getState().openModule('orientation')
    useGame.getState().markLessonRead('orientation', 'orientation-l02')
    expect(useGame.getState().xp).toBe(2 * XP.lesson)
    useGame.getState().recordQuiz('orientation', [{ questionId: 'orientation-q01', correct: true }])
    useGame.getState().recordMini('orientation', 1000)
    expect(useGame.getState().modules.orientation?.completed).toBe(true)
    expect(useGame.getState().review).toEqual([])
    expect(useGame.getState().lastResult?.award.xp).toBeGreaterThan(0)
    expect(JSON.parse(saved.get(STORAGE_KEY)!).state.modules.orientation.completed).toBe(true)
  })

  it('refuses sample results outside debug mode', () => {
    const before = saved.get(STORAGE_KEY)
    useGame.getState().previewResult('mcc')
    expect(useGame.getState().screen).toEqual({ name: 'title' })
    expect(useGame.getState().lastResult).toBeUndefined()
    expect(saved.get(STORAGE_KEY)).toBe(before)
  })

  it('keeps the debug link shareable without persisting the mode in learning data', async () => {
    useGame.getState().setDebugMode(true)
    expect(location.searchParams.get('debug')).toBe('1')
    expect(location.searchParams.get('quality')).toBe('low')
    expect(location.hash).toBe('#training')
    expect(JSON.parse(saved.get(STORAGE_KEY)!).state).not.toHaveProperty('debugMode')
    vi.resetModules()
    const reloaded = (await import('./store')).useGame
    expect(reloaded.getState()).toMatchObject({ debugMode: true, screen: { name: 'hub' }, xp: XP.lesson })
    reloaded.getState().setDebugMode(false)
    expect(location.searchParams.has('debug')).toBe(false)
    expect(location.searchParams.get('quality')).toBe('low')
    expect(location.hash).toBe('#training')
    vi.resetModules()
    const normal = (await import('./store')).useGame
    expect(normal.getState()).toMatchObject({ debugMode: false, screen: { name: 'title' }, xp: XP.lesson })
  })
})

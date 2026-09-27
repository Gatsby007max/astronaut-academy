import { tr, trt } from '../i18n/tr'
import { MODULES } from '../content/modules'
import type { ModuleId } from '../content/types'

export interface ModuleProgress {
  lessonsRead: string[]
  quizBest: number
  quizAttempts: number
  miniBest: number
  miniAttempts: number
  completed: boolean
  perfect: boolean
  completedAt?: number
}

export type ProgressMap = Partial<Record<ModuleId, ModuleProgress>>

export const XP = {
  lesson: 20,
  correct: 15,
  quizPerfect: 100,
  miniMax: 300,
  firstClear: 150,
} as const

export const QUIZ_PASS = 0.7
export const MINI_PASS = 600
export const MINI_MAX = 1000

export interface Rank {
  id: 'ascan' | 'trainee' | 'astronaut' | 'flight'
  title: string
  en: string
  minXp: number
}

export const RANKS: Rank[] = [
  { id: 'ascan', title: tr("宇宙飛行士候補者"), en: 'ASTRONAUT CANDIDATE', minXp: 0 },
  { id: 'trainee', title: tr("上級訓練生"), en: 'ADVANCED TRAINEE', minXp: 900 },
  { id: 'astronaut', title: tr("宇宙飛行士"), en: 'ASTRONAUT', minXp: 3600 },
  { id: 'flight', title: tr("搭乗資格者"), en: 'FLIGHT ELIGIBLE', minXp: 6000 },
]

export function emptyProgress(): ModuleProgress {
  return { lessonsRead: [], quizBest: 0, quizAttempts: 0, miniBest: 0, miniAttempts: 0, completed: false, perfect: false }
}

export function rankFor(xp: number, graduated: boolean): Rank {
  if (graduated) return RANKS[3]
  const earned = RANKS.filter((r) => xp >= r.minXp && (r.id !== 'flight' || graduated))
  return earned[earned.length - 1]
}

export function nextRank(xp: number, graduated: boolean): Rank | undefined {
  const current = rankFor(xp, graduated)
  return RANKS[RANKS.indexOf(current) + 1]
}

export function rankProgress(xp: number, graduated: boolean): number {
  const current = rankFor(xp, graduated)
  const next = nextRank(xp, graduated)
  if (!next) return 1
  return Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp))
}

export function isUnlocked(id: ModuleId, progress: ProgressMap, debugMode = false): boolean {
  if (debugMode) return true
  const meta = MODULES.find((m) => m.id === id)!
  return meta.requires.every((req) => progress[req]?.completed)
}

export function completedCount(progress: ProgressMap): number {
  return MODULES.filter((m) => progress[m.id]?.completed).length
}

export interface Award {
  xp: number
  reasons: string[]
}

export function awardLesson(p: ModuleProgress, lessonId: string): { progress: ModuleProgress; award: Award } {
  if (p.lessonsRead.includes(lessonId)) return { progress: p, award: { xp: 0, reasons: [] } }
  return {
    progress: { ...p, lessonsRead: [...p.lessonsRead, lessonId] },
    award: { xp: XP.lesson, reasons: [tr("レッスン完了")] },
  }
}

export interface QuizAnswer {
  questionId: string
  correct: boolean
}

export function awardQuiz(p: ModuleProgress, answers: QuizAnswer[]): { progress: ModuleProgress; award: Award; score: number } {
  const correct = answers.filter((a) => a.correct).length
  const score = answers.length ? correct / answers.length : 0
  const improvement = Math.max(0, correct - Math.round(p.quizBest * answers.length))
  const reasons: string[] = []
  let xp = improvement * XP.correct
  if (improvement > 0) reasons.push(trt`正解 +${improvement}`)
  if (score === 1 && p.quizBest < 1) {
    xp += XP.quizPerfect
    reasons.push(tr("全問正解ボーナス"))
  }
  const next = { ...p, quizBest: Math.max(p.quizBest, score), quizAttempts: p.quizAttempts + 1 }
  const settled = settle(next)
  if (settled.completed && !p.completed) { xp += XP.firstClear; reasons.push(tr("モジュール修了")) }
  return { progress: settled, award: { xp, reasons }, score }
}

export function awardMini(p: ModuleProgress, score: number): { progress: ModuleProgress; award: Award } {
  const clamped = Math.max(0, Math.min(MINI_MAX, Math.round(score)))
  const reasons: string[] = []
  const toXp = (s: number) => Math.round((s / MINI_MAX) * XP.miniMax)
  let xp = Math.max(0, toXp(clamped) - toXp(p.miniBest))
  if (xp > 0) reasons.push(tr("実技スコア"))
  const next = { ...p, miniBest: Math.max(p.miniBest, clamped), miniAttempts: p.miniAttempts + 1 }
  const settled = settle(next)
  if (settled.completed && !p.completed) {
    xp += XP.firstClear
    reasons.push(tr("モジュール修了"))
  }
  return { progress: settled, award: { xp, reasons } }
}

function settle(p: ModuleProgress): ModuleProgress {
  const completed = p.completed || (p.quizBest >= QUIZ_PASS && p.miniBest >= MINI_PASS)
  const perfect = completed && p.quizBest === 1 && p.miniBest >= 900
  return {
    ...p,
    completed,
    perfect: p.perfect || perfect,
    completedAt: completed ? (p.completedAt ?? Date.now()) : undefined,
  }
}

export function updateReview(review: string[], answers: QuizAnswer[]): string[] {
  const set = new Set(review)
  for (const a of answers) {
    if (a.correct) set.delete(a.questionId)
    else set.add(a.questionId)
  }
  return [...set]
}

export function moduleOfQuestion(questionId: string): ModuleId {
  return questionId.split('-')[0] as ModuleId
}

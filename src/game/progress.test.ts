import { describe, expect, it } from 'vitest'
import {
  awardLesson,
  awardMini,
  awardQuiz,
  emptyProgress,
  isUnlocked,
  MINI_PASS,
  rankFor,
  rankProgress,
  RANKS,
  updateReview,
  XP,
} from './progress'

describe('ranks', () => {
  it('starts as a candidate and climbs with XP', () => {
    expect(rankFor(0, false).id).toBe('ascan')
    expect(rankFor(RANKS[1].minXp, false).id).toBe('trainee')
    expect(rankFor(RANKS[2].minXp + 10, false).id).toBe('astronaut')
  })

  it('requires graduation for flight eligibility', () => {
    expect(rankFor(99999, false).id).toBe('astronaut')
    expect(rankFor(99999, true).id).toBe('flight')
  })

  it('reports progress toward the next rank', () => {
    expect(rankProgress(0, false)).toBe(0)
    expect(rankProgress(RANKS[1].minXp / 2, false)).toBeCloseTo(0.5)
    expect(rankProgress(99999, true)).toBe(1)
  })
})

describe('unlocks', () => {
  it('opens orientation first and gates later modules', () => {
    expect(isUnlocked('orientation', {})).toBe(true)
    expect(isUnlocked('eva', {})).toBe(false)
    expect(isUnlocked('eva', { orientation: { ...emptyProgress(), completed: true } })).toBe(true)
    expect(isUnlocked('robotics', { orientation: { ...emptyProgress(), completed: true } })).toBe(false)
  })

  it('requires every module before the final simulation', () => {
    const done = { ...emptyProgress(), completed: true }
    const almost = { orientation: done, iss: done, medicine: done, eva: done, robotics: done, t38: done, emergency: done }
    expect(isUnlocked('mcc', almost)).toBe(false)
    expect(isUnlocked('mcc', { ...almost, lunar: done })).toBe(true)
  })
})

describe('awards', () => {
  it('awards each lesson only once', () => {
    const first = awardLesson(emptyProgress(), 'eva-l01')
    expect(first.award.xp).toBe(XP.lesson)
    expect(awardLesson(first.progress, 'eva-l01').award.xp).toBe(0)
  })

  it('awards only quiz improvements and a one-time perfect bonus', () => {
    const answers = (n: number, total = 10) =>
      Array.from({ length: total }, (_, i) => ({ questionId: `eva-q${i}`, correct: i < n }))
    const a = awardQuiz(emptyProgress(), answers(6))
    expect(a.award.xp).toBe(6 * XP.correct)
    const b = awardQuiz(a.progress, answers(10))
    expect(b.award.xp).toBe(4 * XP.correct + XP.quizPerfect)
    const c = awardQuiz(b.progress, answers(10))
    expect(c.award.xp).toBe(0)
  })

  it('completes a module once quiz and minigame both pass', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({ questionId: `eva-q${i}`, correct: i < 8 }))
    const quiz = awardQuiz(emptyProgress(), answers)
    expect(quiz.progress.completed).toBe(false)
    const mini = awardMini(quiz.progress, MINI_PASS + 50)
    expect(mini.progress.completed).toBe(true)
    expect(mini.award.reasons).toContain('モジュール修了')
    const again = awardMini(mini.progress, MINI_PASS + 50)
    expect(again.award.xp).toBe(0)
  })

  it('does not complete when the minigame fails', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({ questionId: `eva-q${i}`, correct: true }))
    const quiz = awardQuiz(emptyProgress(), answers)
    expect(awardMini(quiz.progress, MINI_PASS - 1).progress.completed).toBe(false)
  })
})

describe('review list', () => {
  it('adds wrong answers and removes corrected ones', () => {
    const r1 = updateReview([], [
      { questionId: 'a', correct: false },
      { questionId: 'b', correct: true },
    ])
    expect(r1).toEqual(['a'])
    expect(updateReview(r1, [{ questionId: 'a', correct: true }])).toEqual([])
  })
})

describe('completion order and minimum passing graduation',()=>{
 it('awards first clear once even when the quiz is completed last',()=>{
  const mini=awardMini(emptyProgress(),600)
  const answers=Array.from({length:16},(_,i)=>({questionId:`eva-q${i}`,correct:i<12}))
  const quiz=awardQuiz(mini.progress,answers)
  expect(quiz.progress.completed).toBe(true)
  expect(quiz.award.xp).toBe(12*XP.correct+XP.firstClear)
  expect(awardQuiz(quiz.progress,answers).award.xp).toBe(0)
 })
 it('honors graduation after every course passes without requiring perfect scores',()=>{
  expect(rankFor(4590,true).id).toBe('flight')
 })
})

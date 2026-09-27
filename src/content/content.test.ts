import { describe, expect, it } from 'vitest'
import { MODULE_BY_ID } from './modules'
import type { ModuleContent } from './types'

const files = import.meta.glob<{ default: ModuleContent }>('./modules/*.ts', { eager: true })
const OFFICIAL = /^https:\/\/([a-z0-9-]+\.)*(nasa\.gov)(\/|$)/

describe.each(Object.entries(files))('%s', (_path, mod) => {
  const content = mod.default
  const meta = MODULE_BY_ID[content.id]
  const sourceIds = new Set(content.sources.map((s) => s.id))

  it('matches a registered module', () => {
    expect(meta).toBeDefined()
    expect(content.intro.length).toBeGreaterThan(40)
  })

  it('has enough lessons, questions and glossary terms', () => {
    expect(content.lessons.length).toBeGreaterThanOrEqual(8)
    expect(content.lessons.length).toBeLessThanOrEqual(12)
    expect(content.quiz.length).toBeGreaterThanOrEqual(15)
    expect(content.quiz.length).toBeLessThanOrEqual(20)
    expect(content.glossary.length).toBeGreaterThanOrEqual(8)
  })

  it('uses only official NASA sources with unique ids', () => {
    expect(sourceIds.size).toBe(content.sources.length)
    for (const s of content.sources) expect(s.url, s.id).toMatch(OFFICIAL)
  })

  it('has unique ids and valid references in lessons', () => {
    const ids = new Set<string>()
    for (const lesson of content.lessons) {
      expect(ids.has(lesson.id), lesson.id).toBe(false)
      ids.add(lesson.id)
      expect(lesson.body.length, lesson.id).toBeGreaterThanOrEqual(2)
      expect(lesson.sources.length, lesson.id).toBeGreaterThan(0)
      for (const s of lesson.sources) expect(sourceIds.has(s), `${lesson.id} -> ${s}`).toBe(true)
      if (lesson.focus) expect(meta.focusKeys, `${lesson.id} focus`).toContain(lesson.focus)
    }
  })

  it('has well-formed quiz questions with balanced answers', () => {
    const lessonIds = new Set(content.lessons.map((l) => l.id))
    const ids = new Set<string>()
    const answerCounts = [0, 0, 0, 0]
    for (const q of content.quiz) {
      expect(ids.has(q.id), q.id).toBe(false)
      ids.add(q.id)
      expect(q.choices).toHaveLength(4)
      expect(new Set(q.choices).size, `${q.id} duplicate choices`).toBe(4)
      expect(q.explanation.length, q.id).toBeGreaterThan(20)
      expect(q.sources.length, q.id).toBeGreaterThan(0)
      for (const s of q.sources) expect(sourceIds.has(s), `${q.id} -> ${s}`).toBe(true)
      if (q.lessonId) expect(lessonIds.has(q.lessonId), `${q.id} lessonId`).toBe(true)
      answerCounts[q.answer]++
    }
    const max = Math.max(...answerCounts)
    expect(max / content.quiz.length, `answer distribution ${answerCounts.join('/')}`).toBeLessThanOrEqual(0.4)
  })
})

it('keeps review identifiers distinct across courses and provides deep dives',()=>{
 const contents=Object.values(files).map(f=>f.default)
 const ids=contents.flatMap(c=>c.quiz.map(q=>q.id))
 expect(new Set(ids).size).toBe(ids.length)
 for(const c of contents){
  expect(c.lessons.some(l=>l.deepDive?.body.length)).toBe(true)
  expect(c.quiz.every(q=>q.id.startsWith(`${c.id}-`))).toBe(true)
 }
})

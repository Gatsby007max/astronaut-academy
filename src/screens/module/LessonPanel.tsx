import { tr, trt } from '../../i18n/tr'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import type { ModuleContent, ModuleMeta } from '../../content/types'
import { audio } from '../../engine/audio'
import { useGame } from '../../game/store'
import { HudButton, Label, Modal, Panel } from '../../ui/kit'
import { NasaPhoto } from '../../ui/NasaPhoto'
import { usePanelShift } from '../../ui/usePanelShift'
import { SourceList } from './SourceList'

const NO_LESSONS: string[] = []

export function LessonPanel({ meta, content }: { meta: ModuleMeta; content: ModuleContent }) {
  const index = useGame((s) => s.lessonIndex)
  const setIndex = useGame((s) => s.setLessonIndex)
  const setFocus = useGame((s) => s.setFocus)
  const setPhase = useGame((s) => s.setPhase)
  const markRead = useGame((s) => s.markLessonRead)
  const read = useGame((s) => s.modules[meta.id]?.lessonsRead ?? NO_LESSONS)
  const [deep, setDeep] = useState(false)
  const [glossary, setGlossary] = useState(false)
  usePanelShift('right', .17, meta.id === 'iss' ? 532 : undefined, meta.id === 'iss' ? .18 : .2)

  const lesson = content.lessons[Math.min(index, content.lessons.length - 1)]
  const sources = useMemo(() => content.sources.filter((s) => lesson.sources.includes(s.id)), [content, lesson])
  const last = index >= content.lessons.length - 1

  useEffect(() => {
    setFocus(lesson.focus ?? 'overview')
    setDeep(false)
    const timer = setTimeout(() => markRead(meta.id, lesson.id), 4000)
    return () => clearTimeout(timer)
  }, [lesson, meta.id, markRead, setFocus])

  const go = (delta: number) => {
    markRead(meta.id, lesson.id)
    audio.sfx('click')
    setIndex(Math.max(0, Math.min(content.lessons.length - 1, index + delta)))
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 top-auto flex h-[58vh] justify-end p-3 md:inset-y-0 md:h-auto md:p-4 md:pt-32">
      <Panel className="flex w-full flex-col md:w-[500px]">
        <div className="scroll-thin flex items-center gap-1 overflow-x-auto border-b border-white/10 px-3 py-2">
          {content.lessons.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                markRead(meta.id, lesson.id)
                setIndex(i)
                audio.sfx('click')
              }}
              title={l.title}
              className="group grid h-6 min-w-6 place-items-center rounded font-mono text-[10px] transition"
              style={{
                background: i === index ? meta.color : read.includes(l.id) ? `${meta.color}33` : 'rgba(255,255,255,0.06)',
                color: i === index ? '#021018' : 'rgba(255,255,255,0.7)',
              }}
            >
              {i + 1}
            </button>
          ))}
          <div className="flex-1" />
          <HudButton variant="subtle" onClick={() => setGlossary(true)} className="shrink-0 whitespace-nowrap px-2 py-1 text-xs">
            {tr("用語集")}</HudButton>
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={lesson.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="scroll-thin flex-1 overflow-y-auto px-5 py-4"
          >
            <div className="flex items-center gap-2">
              <span className="rounded px-1.5 py-0.5 font-mono text-[10px] tracking-widest" style={{ background: `${meta.color}22`, color: meta.color }}>
                {lesson.kicker}
              </span>
              <Label>
                LESSON {String(index + 1).padStart(2, '0')} / {String(content.lessons.length).padStart(2, '0')}
              </Label>
              {read.includes(lesson.id) && <span className="font-mono text-[10px] text-ok">READ</span>}
            </div>
            <h2 className="mt-2 text-xl font-semibold leading-snug md:text-2xl">{lesson.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{lesson.summary}</p>

            <NasaPhoto query={lesson.imageQuery} className="mt-4" />

            <div className="mt-4 space-y-3 text-[14px] leading-7 text-white/88">
              {lesson.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {lesson.facts && lesson.facts.length > 0 && (
              <dl className="mt-5 grid grid-cols-2 gap-2">
                {lesson.facts.map((f) => (
                  <div key={f.label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                    <dt className="font-mono text-[10px] tracking-wider text-white/45">{f.label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold" style={{ color: meta.color }}>
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {lesson.deepDive && (
              <div className="mt-5 rounded-lg border border-white/10 bg-black/20">
                <button type="button" onClick={() => setDeep((d) => !d)} className="flex w-full items-center justify-between px-3 py-2 text-left">
                  <span>
                    <Label>DEEP DIVE</Label>
                    <span className="text-sm font-medium">{lesson.deepDive.title}</span>
                  </span>
                  <span className="font-mono text-xs text-white/50">{deep ? '−' : '+'}</span>
                </button>
                <AnimatePresence initial={false}>
                  {deep && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="space-y-2 px-3 pb-3 text-[13px] leading-6 text-white/75">
                        {lesson.deepDive.body.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <SourceList sources={sources} className="mt-5" />
          </motion.article>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
          <HudButton sound={false} onClick={() => go(-1)} disabled={index === 0}>
            {tr("前へ")}</HudButton>
          <div className="font-mono text-[11px] text-white/45">
            {tr("既読")}{read.length}/{content.lessons.length}
          </div>
          {last ? (
            <HudButton
              variant="primary"
              sound="confirm"
              onClick={() => {
                markRead(meta.id, lesson.id)
                setPhase('quiz')
              }}
            >
              {tr("クイズへ進む")}</HudButton>
          ) : (
            <HudButton variant="primary" sound={false} onClick={() => go(1)}>
              {tr("次へ")}</HudButton>
          )}
        </div>
      </Panel>

      <Modal open={glossary} onClose={() => setGlossary(false)} title={trt`用語集: ${meta.title}`} wide>
        <dl className="grid gap-3 md:grid-cols-2">
          {content.glossary.map((g) => (
            <div key={g.term} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <dt className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold">{g.term}</span>
                {g.abbr && <span className="font-mono text-xs" style={{ color: meta.color }}>{g.abbr}</span>}
              </dt>
              <div className="font-mono text-[11px] text-white/45">{g.en}</div>
              <dd className="mt-1 text-sm leading-6 text-white/75">{g.description}</dd>
            </div>
          ))}
        </dl>
      </Modal>
    </div>
  )
}

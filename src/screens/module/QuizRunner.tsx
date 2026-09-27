import { tr } from '../../i18n/tr'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import type { QuizQuestion, Source } from '../../content/types'
import { audio } from '../../engine/audio'
import type { QuizAnswer } from '../../game/progress'
import { HudButton, Label, Meter } from '../../ui/kit'
import { SourceList } from './SourceList'

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface QuizRunnerProps {
  questions: QuizQuestion[]
  sources: Source[]
  color: string
  onDone: (answers: QuizAnswer[]) => void
  heading?: string
  preview?: boolean
}

export function QuizRunner({ questions, sources, color, onDone, heading, preview = false }: QuizRunnerProps) {
  const orders = useMemo(() => questions.map(() => shuffled(4)), [questions])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const q = questions[index]
  const order = orders[index]
  const revealed = picked !== null || (preview && showAnswer)
  const correctCount = answers.filter((a) => a.correct).length
  const qSources = sources.filter((s) => q.sources.includes(s.id))

  const choose = (displayIndex: number) => {
    if (revealed) return
    const original = order[displayIndex]
    const correct = original === q.answer
    audio.sfx(correct ? 'correct' : 'wrong')
    setPicked(displayIndex)
    setAnswers((a) => [...a.filter((answer) => answer.questionId !== q.id), { questionId: q.id, correct }])
  }

  const next = () => {
    if (index + 1 >= questions.length) {
      onDone(answers)
      return
    }
    setIndex(index + 1)
    setPicked(null)
    setShowAnswer(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/10 px-5 py-3">
        <div className="flex items-center justify-between">
          <Label>{heading ?? 'KNOWLEDGE CHECK'}</Label>
          <span className="font-mono text-[11px] text-white/55">
            Q{index + 1}/{questions.length}{tr("・正解")}{correctCount}
          </span>
        </div>
        <Meter value={(index + (revealed ? 1 : 0)) / questions.length} color={color} className="mt-2" />
        {preview && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select aria-label={tr("デバッグ：表示する問題")} value={index} onChange={(e) => {
              setIndex(Number(e.target.value))
              setPicked(null)
              setShowAnswer(false)
            }} className="min-h-11 rounded-md border border-amber/30 bg-[#101724] px-2 text-xs text-amber">
              {questions.map((question, i) => <option key={question.id} value={i}>{tr("問題")}{i + 1} / {questions.length}</option>)}
            </select>
            <HudButton className="min-h-11 px-2 text-xs" onClick={() => setShowAnswer(true)} disabled={revealed}>{tr("正解と解説を表示")}</HudButton>
          </div>
        )}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-1 font-mono text-[10px] text-white/40">{'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}</div>
          <h3 className="text-lg font-semibold leading-relaxed">{q.prompt}</h3>
          <div className="mt-4 grid gap-2">
            {order.map((original, displayIndex) => {
              const isCorrect = original === q.answer
              const isPicked = picked === displayIndex
              let tone = 'border-white/12 bg-white/[0.04] hover:border-white/35 hover:bg-white/[0.08]'
              if (revealed && isCorrect) tone = 'border-ok/70 bg-ok/15'
              else if (revealed && isPicked) tone = 'border-alert/70 bg-alert/15'
              else if (revealed) tone = 'border-white/8 bg-white/[0.02] opacity-60'
              return (
                <button
                  key={displayIndex}
                  type="button"
                  disabled={revealed}
                  onClick={() => choose(displayIndex)}
                  onPointerEnter={() => !revealed && audio.sfx('hover')}
                  className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm leading-6 transition ${tone}`}
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded font-mono text-[11px]" style={{ background: `${color}22`, color }}>
                    {'ABCD'[displayIndex]}
                  </span>
                  <span>{q.choices[original]}</span>
                </button>
              )
            })}
          </div>
          <AnimatePresence>
            {revealed && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
                <div className={`font-mono text-xs tracking-widest ${picked === null || order[picked] === q.answer ? 'text-ok' : 'text-alert'}`}>{picked === null ? tr("ANSWER · 正解") : order[picked] === q.answer ? 'CORRECT' : 'INCORRECT'}</div>
                <p className="mt-1 text-sm leading-6 text-white/80">{q.explanation}</p>
                <SourceList sources={qSources} className="mt-3" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 px-5 py-3">
        {preview && index + 1 < questions.length && <HudButton onClick={() => onDone(answers)}>{tr("結果を見る")}</HudButton>}
        <HudButton variant="primary" sound="click" disabled={!revealed && !preview} onClick={next}>
          {index + 1 >= questions.length ? tr("結果を見る") : tr("次の問題")}
        </HudButton>
      </div>
    </div>
  )
}

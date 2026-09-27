import { tr, trt } from '../../i18n/tr'
import { motion } from 'motion/react'
import { useState } from 'react'
import type { ModuleContent, ModuleMeta } from '../../content/types'
import { QUIZ_PASS, type QuizAnswer } from '../../game/progress'
import { useGame } from '../../game/store'
import { HudButton, Label, Panel } from '../../ui/kit'
import { usePanelShift } from '../../ui/usePanelShift'
import { QuizRunner } from './QuizRunner'

export function QuizPanel({ meta, content }: { meta: ModuleMeta; content: ModuleContent }) {
  const recordQuiz = useGame((s) => s.recordQuiz)
  const setPhase = useGame((s) => s.setPhase)
  const best = useGame((s) => s.modules[meta.id]?.quizBest ?? 0)
  const debugMode = useGame((s) => s.debugMode)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ score: number; answers: QuizAnswer[] } | null>(null)
  usePanelShift('right', .17, meta.id === 'iss' ? 572 : undefined, meta.id === 'iss' ? .14 : .2)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 flex h-[52dvh] justify-end p-3 md:inset-y-0 md:h-auto md:p-4 md:pt-32">
      <Panel className="flex w-full flex-col md:w-[540px]">
        {result ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-1 flex-col items-center gap-4 overflow-y-auto p-6 text-center md:justify-center md:p-8">
            <Label>QUIZ RESULT</Label>
            {debugMode && <p className="text-xs text-amber">{tr("デバッグ表示 · 成績は保存されません")}</p>}
            <div className="font-mono text-6xl font-light" style={{ color: result.score >= QUIZ_PASS ? '#52f2a4' : '#ff4d5e' }}>
              {Math.round(result.score * 100)}%
            </div>
            <div className="text-sm text-white/70">
              {result.answers.filter((a) => a.correct).length} / {result.answers.length} {tr("問正解")}{debugMode ? trt`（回答した問題のみ・全${content.quiz.length}問）` : trt`・合格ライン ${Math.round(QUIZ_PASS * 100)}%`}
            </div>
            <div className="text-sm text-white/55">
              {debugMode ? tr("問題を選び直したり、そのまま実技訓練を確認できます。") : result.score >= QUIZ_PASS ? tr("知識確認に合格しました。実技訓練に進みましょう。") : tr("合格ラインに届きませんでした。間違えた問題は「復習」に登録されています。")}
            </div>
            {!debugMode && <div className="text-xs text-white/40">{tr("自己ベスト")}{Math.round(Math.max(best, result.score) * 100)}%</div>}
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <HudButton sound="back" onClick={() => setPhase('brief')}>
                {tr("レッスンに戻る")}</HudButton>
              <HudButton
                onClick={() => {
                  setResult(null)
                  setAttempt((a) => a + 1)
                }}
              >
                {tr("もう一度挑戦")}</HudButton>
              <HudButton variant="primary" sound="confirm" onClick={() => setPhase('mini')}>
                {tr("実技訓練へ")}</HudButton>
            </div>
          </motion.div>
        ) : (
          <QuizRunner
            key={attempt}
            questions={content.quiz}
            sources={content.sources}
            color={meta.color}
            preview={debugMode}
            onDone={(answers) => {
              const score = recordQuiz(meta.id, answers)
              setResult({ score, answers })
            }}
          />
        )}
      </Panel>
    </div>
  )
}

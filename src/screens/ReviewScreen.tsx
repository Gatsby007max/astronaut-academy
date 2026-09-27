import { tr, trt } from '../i18n/tr'
import { Suspense, use, useMemo, useState } from 'react'
import { loadModuleContent } from '../content/loader'
import { MODULES, MODULE_BY_ID } from '../content/modules'
import type { ModuleContent, ModuleId } from '../content/types'
import { moduleOfQuestion } from '../game/progress'
import { useGame } from '../game/store'
import { QuizRunner } from './module/QuizRunner'
import { HudButton, Label, Panel } from '../ui/kit'
import { usePanelShift } from '../ui/usePanelShift'

const bundles = new Map<string, Promise<(ModuleContent | null)[]>>()
function reviewBundle(ids: ModuleId[]) {
  const key = ids.join(',')
  if (!bundles.has(key)) bundles.set(key, Promise.all(ids.map(id => loadModuleContent(id).catch(() => null))))
  return bundles.get(key)!
}

function ReviewBody({ ids }: { ids: string[] }) {
  const debugMode = useGame((s) => s.debugMode)
  const moduleIds = useMemo(() => debugMode ? MODULES.map((m) => m.id) : [...new Set(ids.map(moduleOfQuestion))] as ModuleId[], [ids, debugMode])
  const loading = reviewBundle(moduleIds)
  const contents = use(loading).filter(Boolean) as ModuleContent[]
  const recordReview = useGame((s) => s.recordReview)
  const go = useGame((s) => s.go)
  const [done, setDone] = useState<number | null>(null)
  const questions = useMemo(() => debugMode ? contents.flatMap((c) => c.quiz.slice(0, 1)) : contents.flatMap((c) => c.quiz.filter((q) => ids.includes(q.id))).slice(0, 15), [contents, ids, debugMode])
  const sources = useMemo(() => contents.flatMap((c) => c.sources), [contents])

  if (done !== null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <Label>REVIEW COMPLETE</Label>
        <div className="font-mono text-5xl text-hud">{done}</div>
        <div className="text-sm text-white/65">{debugMode ? tr("問正解 · デバッグ表示のため復習リストは変更されません。") : trt`問を克服しました。残りの復習: ${useGame.getState().review.length} 問`}</div>
        <HudButton variant="primary" onClick={() => go({ name: 'hub' })}>
          {tr("ハブに戻る")}</HudButton>
      </div>
    )
  }
  if (!questions.length) {
    return <div className="p-8 text-center text-sm text-white/60">{tr("復習する問題はありません。")}</div>
  }
  return (
    <QuizRunner
      questions={questions}
      sources={sources.filter((s, i) => sources.findIndex(x => x.id === s.id) === i)}
      color="#ffb547"
      heading={debugMode ? tr("DEBUG REVIEW · 各コースの問題サンプル") : `REVIEW — ${moduleIds.map((m) => MODULE_BY_ID[m].title).join(' / ')}`}
      preview={debugMode}
      onDone={(answers) => {
        recordReview(answers)
        setDone(answers.filter((a) => a.correct).length)
      }}
    />
  )
}

export function ReviewScreen() {
  const review = useGame((s) => s.review)
  const [snapshot] = useState(review)
  usePanelShift('right')
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 flex h-[70vh] justify-end p-3 md:inset-y-0 md:h-auto md:p-4 md:pt-24">
      <Panel className="flex w-full flex-col md:w-[540px]">
        <Suspense fallback={<div className="p-8"><Label>LOADING…</Label></div>}>
          <ReviewBody ids={snapshot} />
        </Suspense>
      </Panel>
    </div>
  )
}

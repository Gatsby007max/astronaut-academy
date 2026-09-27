import { tr } from '../../i18n/tr'
import { Suspense, use } from 'react'
import { loadModuleContent } from '../../content/loader'
import { MODULE_BY_ID } from '../../content/modules'
import type { ModuleId, ModuleMeta } from '../../content/types'
import { miniGameFor } from '../../minigames/registry'
import { MINI_PASS, QUIZ_PASS } from '../../game/progress'
import { useGame, type ModulePhase } from '../../game/store'
import { ErrorBoundary } from '../../ui/ErrorBoundary'
import { HudButton, Label, Panel } from '../../ui/kit'
import { LessonPanel } from './LessonPanel'
import { QuizPanel } from './QuizPanel'
import { ResultPanel } from './ResultPanel'
import { examParticles } from '../../engine/particles/surface'
import { ISS_MODEL_NOTE, ISS_MODEL_SOURCE } from '../../world/issParts'

const PHASES: { id: ModulePhase; label: string }[] = [
  { id: 'brief', label: tr("ブリーフィング") },
  { id: 'quiz', label: tr("知識確認") },
  { id: 'mini', label: tr("実技訓練") },
]

function PhaseTabs({ meta, phase }: { meta: ModuleMeta; phase: ModulePhase }) {
  const setPhase = useGame((s) => s.setPhase)
  const p = useGame((s) => s.modules[meta.id])
  const status: Record<ModulePhase, boolean> = {
    brief: (p?.lessonsRead.length ?? 0) > 0,
    quiz: (p?.quizBest ?? 0) >= QUIZ_PASS,
    mini: (p?.miniBest ?? 0) >= MINI_PASS,
    result: false,
  }
  return (
    <div className="pointer-events-none phase-tabs fixed left-1/2 top-[4.6rem] z-30 -translate-x-1/2">
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-full p-1">
        <span className="hidden lg:block px-3 font-mono text-[10px] tracking-widest" style={{ color: meta.color }}>
          {String(meta.index).padStart(2, '0')} {meta.title}
        </span>
        {PHASES.map((ph) => (
          <button
            key={ph.id}
            type="button"
            onClick={() => setPhase(ph.id)}
            className={`rounded-full px-3 py-1 text-xs transition ${phase === ph.id || (phase === 'result' && ph.id === 'mini') ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white'}`}
          >
            {ph.label}
            {status[ph.id] && <span className="ml-1 text-ok">●</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function MiniStage({ meta }: { meta: ModuleMeta }) {
  const recordMini = useGame((s) => s.recordMini)
  const setPhase = useGame((s) => s.setPhase)
  const Game = miniGameFor(meta.id)
  if (!Game) {
    return (
      <div className="pointer-events-none fixed inset-0 grid place-items-center">
        <Panel className="p-6 text-sm text-white/70">{tr("この実技訓練は準備中です。")}</Panel>
      </div>
    )
  }
  return (
    <Game
      color={meta.color}
      onExit={() => setPhase('brief')}
      onFinish={(score) => {
        recordMini(meta.id, score)
        setPhase('result')
      }}
    />
  )
}

function ModuleBody({ id, phase }: { id: ModuleId; phase: ModulePhase }) {
  const meta = MODULE_BY_ID[id]
  const locale = useGame((s) => s.settings.locale)
  const content = use(loadModuleContent(id, locale))
  return (
    <>
      <PhaseTabs meta={meta} phase={phase} />
      <div className="pointer-events-none fixed left-4 top-[7.4rem] z-20 max-w-[min(75vw,25rem)] md:top-24">
        <div className="flex items-center gap-2 font-mono text-[9px] tracking-[.18em] text-white/55">
          <span className={`h-1 w-1 rounded-full ${examParticles({ name: 'module', phase }) ? 'bg-hud shadow-[0_0_8px_#7fe3ff]' : 'bg-amber'}`} />
          {examParticles({ name: 'module', phase }) ? tr("FOCUS · 高密度") : tr("FLOW · 点群")}
        </div>
        {id === 'iss' && <details className="pointer-events-auto mt-2 w-fit max-w-full rounded-lg border border-white/10 bg-[#030812]/90 px-2.5 py-1.5 text-[10px] leading-5 text-white/60">
          <summary className="cursor-pointer select-none">{tr("NASAモデルについて · 旧構成")}</summary>
          <p className="mt-2 max-w-72">{ISS_MODEL_NOTE}</p>
          <p className="mt-2 max-w-72">{tr("点群の色は構造を区別するための学習用配色です。外枠も点列で描き、試験中は表面の点が密集します。")}</p>
          <a className="text-hud hover:underline" href={ISS_MODEL_SOURCE} target="_blank" rel="noreferrer">{tr("NASAの元モデル ↗")}</a>
        </details>}
        {id === 'iss' && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-white/60" aria-label={tr("ISSの配色凡例")}>
          {([['#c89a50', tr("太陽電池")], ['#cbdce6', tr("居住区")], ['#58a6be', tr("トラス")], ['#889cc9', tr("放熱板")]] as const).map(([color, label]) => <span key={label} className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}
        </div>}
      </div>
      {phase === 'brief' && <LessonPanel meta={meta} content={content} />}
      {phase === 'quiz' && <QuizPanel meta={meta} content={content} />}
      {phase === 'mini' && <MiniStage meta={meta} />}
      {phase === 'result' && <ResultPanel meta={meta} />}
    </>
  )
}

export function ModuleScreen({ id, phase }: { id: ModuleId; phase: ModulePhase }) {
  const go = useGame((s) => s.go)
  return (
    <ErrorBoundary
      resetKey={`${id}:${phase}`}
      fallback={() => (
        <div className="pointer-events-none fixed inset-0 grid place-items-center p-4">
          <Panel className="max-w-sm p-6 text-center">
            <Label>DATA UNAVAILABLE</Label>
            <p className="mt-2 text-sm text-white/70">{tr("この訓練モジュールのデータを読み込めませんでした。")}</p>
            <HudButton className="mt-4" onClick={() => go({ name: 'hub' })}>
              {tr("ハブに戻る")}</HudButton>
          </Panel>
        </div>
      )}
    >
      <Suspense
        fallback={
          <div className="pointer-events-none fixed inset-0 grid place-items-center">
            <Label>LOADING TRAINING DATA…</Label>
          </div>
        }
      >
        <ModuleBody id={id} phase={phase} />
      </Suspense>
    </ErrorBoundary>
  )
}

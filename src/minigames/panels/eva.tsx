import { tr, trt } from '../../i18n/tr'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { audio } from '../../engine/audio'
import { useGame } from '../../game/store'
import { HudButton, Label, Panel } from '../../ui/kit'
import { usePanelShift } from '../../ui/usePanelShift'
import { currentWeighOutScore, MOUNTS, STEP_KG, TOLERANCE, trimFor, useBuoyancy } from '../buoyancy'
import { MiniBriefing, ScoreReadout } from '../MiniShell'
import { pickScenarios, PREBREATHE_SOURCE, prebreatheScore } from '../prebreathe'
import type { MiniGameProps } from '../registry'

function TrimGauge({ label, value, unit, negative, positive }: { label: string; value: number; unit: string; negative: string; positive: string }) {
  const ok = Math.abs(value) <= TOLERANCE
  const pos = Math.max(-1, Math.min(1, value / 4))
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] text-white/55">
        <span>{label}</span>
        <span className={ok ? 'text-ok' : 'text-amber'}>
          {value > 0 ? '+' : ''}
          {value.toFixed(2)} {unit}
        </span>
      </div>
      <div className="relative mt-1 h-3 rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-1/2 w-[12.5%] -translate-x-1/2 rounded-full bg-ok/25" />
        <motion.div className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" animate={{ left: `${50 + pos * 50}%` }} style={{ borderColor: ok ? '#52f2a4' : '#ffb547', background: '#061220' }} />
      </div>
      <div className="mt-0.5 flex justify-between font-mono text-[9px] text-white/35">
        <span>{negative}</span>
        <span>{positive}</span>
      </div>
    </div>
  )
}

function WeighOut({ color, onDone }: { color: string; onDone: (score: number) => void }) {
  const { initial, loadout, moves, failedChecks, finishedAt, adjust, check } = useBuoyancy()
  const [now, setNow] = useState(() => performance.now())
  const [message, setMessage] = useState<string | null>(null)
  const trim = trimFor(initial, loadout)
  const startedAt = useBuoyancy((s) => s.startedAt)

  useEffect(() => {
    if (finishedAt) return
    const id = setInterval(() => setNow(performance.now()), 250)
    return () => clearInterval(id)
  }, [finishedAt])

  useEffect(() => {
    if (!finishedAt) return
    const score = currentWeighOutScore(useBuoyancy.getState())
    const t = setTimeout(() => onDone(score), 2200)
    return () => clearTimeout(t)
  }, [finishedAt, onDone])

  const seconds = ((finishedAt ?? now) - startedAt) / 1000
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center p-3 md:inset-y-0 md:right-auto md:items-center md:p-4 md:pt-24">
      <Panel className="scroll-thin w-full max-h-[50dvh] overflow-x-hidden overflow-y-auto p-4 md:max-h-[82dvh] md:w-[380px]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Label>STAGE 1 / 2 — WEIGH-OUT</Label>
            <div className="text-base font-semibold" style={{ color }}>
              {tr("中性浮力ウェイトアウト")}</div>
          </div>
          <div className="flex gap-3">
            <ScoreReadout label="TIME" value={`${Math.floor(seconds)}s`} />
            <ScoreReadout label="MOVES" value={moves} />
          </div>
        </div>
        <p className="mt-2 text-xs leading-5 text-white/60">
          {tr("浮力・前後の傾き・左右の傾きのすべてを緑の範囲（±")}{TOLERANCE}{tr("）に収めてください。錘1個・浮き1個は")}{STEP_KG}{tr("kg相当です。")}</p>
        <div className="mt-3 space-y-3">
          <TrimGauge label={tr("浮力 NET BUOYANCY")} value={trim.buoyancy} unit="kg" negative={tr("沈む")} positive={tr("浮く")} />
          <TrimGauge label={tr("ピッチ PITCH")} value={trim.pitch} unit="kg·m" negative={tr("後傾")} positive={tr("前傾")} />
          <TrimGauge label={tr("ロール ROLL")} value={trim.roll} unit="kg·m" negative={tr("左傾")} positive={tr("右傾")} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {MOUNTS.map((m) => {
            const n = loadout[m.id]
            return (
              <div key={m.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                <div className="text-xs font-medium">{m.label}</div>
                <div className="font-mono text-[10px] text-white/45">{n > 0 ? trt`錘 ${(n * STEP_KG).toFixed(1)}kg` : n < 0 ? trt`浮き ${(-n * STEP_KG).toFixed(1)}kg` : tr("なし")}</div>
                <div className="mt-1.5 flex gap-1">
                  <HudButton className="flex-1 px-1 py-1 text-[11px]" disabled={!!finishedAt} onClick={() => adjust(m.id, -1)}>
                    {tr("浮き＋")}</HudButton>
                  <HudButton className="flex-1 px-1 py-1 text-[11px]" disabled={!!finishedAt} onClick={() => adjust(m.id, 1)}>
                    {tr("錘＋")}</HudButton>
                </div>
              </div>
            )
          })}
        </div>
        <AnimatePresence>
          {message && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`mt-3 text-xs ${finishedAt ? 'text-ok' : 'text-alert'}`}>
              {message}
            </motion.div>
          )}
        </AnimatePresence>
        <HudButton
          variant="primary"
          className="mt-3 w-full"
          disabled={!!finishedAt}
          sound={false}
          onClick={() => {
            const ok = check()
            audio.sfx(ok ? 'correct' : 'wrong')
            setMessage(ok ? tr("セーフティダイバー: 「ニュートラル、トリム良好」。宇宙服はどの姿勢でも静止しています。") : trt`まだ${Math.abs(trim.buoyancy) > TOLERANCE ? (trim.buoyancy > 0 ? tr('浮いて') : tr('沈んで')) : tr('傾いて')}います。判定失敗は減点されます（${failedChecks + 1}回目）。`)
          }}
        >
          {tr("中性浮力を判定する")}</HudButton>
      </Panel>
    </div>
  )
}

function Prebreathe({ color, onDone }: { color: string; onDone: (score: number) => void }) {
  const scenarios = useMemo(() => pickScenarios(), [])
  const [index, setIndex] = useState(0)
  const [attempts, setAttempts] = useState<string[]>([])
  const [tally, setTally] = useState({ first: 0, second: 0 })
  const scenario = scenarios[index]
  const solved = attempts.includes(scenario.answer)
  const exhausted = attempts.length >= 2

  const choose = (id: string) => {
    if (solved || exhausted || attempts.includes(id)) return
    const next = [...attempts, id]
    setAttempts(next)
    const correct = id === scenario.answer
    audio.sfx(correct ? 'correct' : 'wrong')
    if (correct) setTally((t) => (next.length === 1 ? { ...t, first: t.first + 1 } : { ...t, second: t.second + 1 }))
  }

  const advance = () => {
    if (index + 1 >= scenarios.length) {
      onDone(prebreatheScore(tally.first, tally.second))
      return
    }
    setIndex(index + 1)
    setAttempts([])
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center p-3 md:inset-y-0 md:left-auto md:items-center md:p-4 md:pt-24">
      <Panel className="scroll-thin w-full max-h-[58dvh] overflow-x-hidden overflow-y-auto p-5 md:max-h-[82dvh] md:w-[520px]">
        <div className="flex items-center justify-between">
          <Label>
            STAGE 2 / 2 — PREBREATHE {index + 1}/{scenarios.length}
          </Label>
          <span className="font-mono text-xs" style={{ color }}>
            {prebreatheScore(tally.first, tally.second)} pt
          </span>
        </div>
        <div className="mt-1 text-base font-semibold" style={{ color }}>
          {tr("減圧症を防ぐプレブリーズ手順の選択")}</div>
        <AnimatePresence mode="wait">
          <motion.div key={scenario.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <p className="mt-3 text-sm leading-6 text-white/85">{scenario.situation}</p>
            <div className="mt-3 grid gap-2">
              {scenario.options.map((o) => {
                const picked = attempts.includes(o.id)
                const isAnswer = o.id === scenario.answer
                const reveal = solved || exhausted
                const tone = picked && isAnswer ? 'border-ok/70 bg-ok/15' : picked ? 'border-alert/60 bg-alert/10' : reveal && isAnswer ? 'border-ok/50' : 'border-white/12 bg-white/[0.04] hover:border-white/35'
                return (
                  <button key={o.id} type="button" onClick={() => choose(o.id)} disabled={reveal || picked} className={`pointer-events-auto rounded-lg border px-3 py-2 text-left transition ${tone}`}>
                    <div className="text-sm font-medium">{o.label}</div>
                    <div className="text-xs text-white/55">{o.detail}</div>
                  </button>
                )
              })}
            </div>
            {(solved || exhausted) && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3 text-sm leading-6 text-white/80">
                {scenario.explanation}
                <a href={PREBREATHE_SOURCE.url} target="_blank" rel="noreferrer" className="pointer-events-auto mt-1 block font-mono text-[10px] text-hud hover:underline">
                  {tr("出典:")}{PREBREATHE_SOURCE.title}
                </a>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex justify-between text-xs text-white/45">
          <span>{!solved && !exhausted && attempts.length === 1 ? tr("不正解。もう一度だけ選べます（部分点）。") : ''}</span>
          <HudButton variant="primary" disabled={!(solved || exhausted)} onClick={advance}>
            {index + 1 >= scenarios.length ? tr("訓練を終了") : tr("次のシナリオ")}
          </HudButton>
        </div>
      </Panel>
    </div>
  )
}

export default function EvaTraining({ onFinish, onExit, color }: MiniGameProps) {
  const setFocus = useGame((s) => s.setFocus)
  const reset = useBuoyancy((s) => s.reset)
  const [stage, setStage] = useState<'brief' | 'weigh' | 'prebreathe'>('brief')
  const [weighScore, setWeighScore] = useState(0)
  usePanelShift('none')

  useEffect(() => {
    setFocus(stage === 'prebreathe' ? 'prebreathe' : stage === 'weigh' ? 'weigh' : 'suit')
  }, [stage, setFocus])

  if (stage === 'brief') {
    return (
      <MiniBriefing
        title={tr("ウェイトアウトとプレブリーズ")}
        color={color}
        lines={[
          tr("ステージ1: 宇宙服を着た訓練生に錘と浮きを取り付け、浮きも沈みもせず、傾きもしない「中性浮力」に調整します（最大600点）。"),
          tr("少ない操作回数・短い時間で調整するほど高得点です。判定に失敗すると減点されます。"),
          tr("ステージ2: 状況に合った減圧症予防のプレブリーズ手順を選びます（最大400点）。"),
        ]}
        onExit={onExit}
        onStart={() => {
          reset()
          setStage('weigh')
        }}
      />
    )
  }
  if (stage === 'weigh') {
    return (
      <WeighOut
        color={color}
        onDone={(score) => {
          setWeighScore(score)
          setStage('prebreathe')
        }}
      />
    )
  }
  return <Prebreathe color={color} onDone={(score) => onFinish(weighScore + score)} />
}

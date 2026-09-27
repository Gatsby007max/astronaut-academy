import { tr, trt } from '../../i18n/tr'
import { useEffect, useState } from 'react'
import { useGame } from '../../game/store'
import { HudButton, Panel } from '../../ui/kit'
import { usePanelShift } from '../../ui/usePanelShift'
import { FactToast, MiniBriefing, MiniHud, ScoreReadout } from '../MiniShell'
import { PROMPTS_PER_RUN, SCAN_TARGETS, useOrbitScan } from '../orbitScan'
import type { MiniGameProps } from '../registry'

export default function OrientationScan({ onFinish, onExit, color }: MiniGameProps) {
  const setFocus = useGame((s) => s.setFocus)
  const { status, order, index, score, mistakes, feedback, arm, reset } = useOrbitScan()
  const [started, setStarted] = useState(false)
  usePanelShift('none')

  useEffect(() => {
    reset()
    setFocus('scan')
    return () => reset()
  }, [reset, setFocus])

  useEffect(() => {
    if (status !== 'done') return
    const t = setTimeout(() => onFinish(Math.min(1000, Math.round(score / Math.max(1, order.length * 170) * 1000))), 2600)
    return () => clearTimeout(t)
  }, [status, score, order.length, onFinish])

  if (!started) {
    return (
      <MiniBriefing
        title={tr("軌道観測ブリーフィング")}
        color={color}
        lines={[
          tr("ISSのキューポラから外を観察し、指示されたターゲットを見つけてスキャンします。"),
          trt`全${PROMPTS_PER_RUN}問。画面に表示されるA〜Iのマーカーから、指示に合うものをクリックしてください。`,
          tr("素早く正確にスキャンするほど高得点です。誤スキャンは減点されます。"),
        ]}
        controls={[tr("マウス / タップ: マーカーをスキャン")]}
        onExit={onExit}
        onStart={() => {
          setStarted(true)
          arm()
        }}
      />
    )
  }

  const visible = useOrbitScan.getState().visible
  const ids = SCAN_TARGETS.map(t => t.id).filter(id => visible[id])
  const prompt = SCAN_TARGETS.find((t) => t.id === order[index])
  return (
    <>
      <MiniHud>
        <Panel className="flex w-[min(640px,94vw)] items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color }}>
              {status === 'arming' ? 'ACQUIRING TARGETS…' : status === 'done' ? 'SCAN COMPLETE' : `TARGET ${index + 1} / ${order.length}`}
            </div>
            <div className="mt-0.5 text-sm font-medium md:text-base">
              {status === 'running' && prompt ? `${tr("スキャン対象: ")}${prompt.prompt}` : status === 'done' ? tr("観測データを管制室に送信中…") : tr("センサーを較正しています")}
            </div>
          </div>
          <ScoreReadout label="SCORE" value={Math.min(1000, score)} color={color} />
          <ScoreReadout label="MISS" value={mistakes} color={mistakes ? '#ff4d5e' : undefined} />
        </Panel>
      </MiniHud>
      {status === 'running' && <div className="scan-keypad pointer-events-auto fixed right-4 top-52 flex flex-col gap-1 rounded-lg glass p-2" aria-label={tr("観測マーカーの選択")}>{ids.map((id,i)=><HudButton key={id} className="px-3 py-1 text-xs" onClick={()=>useOrbitScan.getState().pick(id)}>{tr("マーカー")}{'ABCDEFGHIJ'[i]}</HudButton>)}</div>}
      <FactToast text={feedback?.text} ok={feedback?.ok} stamp={feedback?.at} />
    </>
  )
}

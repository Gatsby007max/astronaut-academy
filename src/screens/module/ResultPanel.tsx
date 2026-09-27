import { tr, trt } from '../../i18n/tr'
import { motion } from 'motion/react'
import type { ModuleMeta } from '../../content/types'
import { MINI_PASS, QUIZ_PASS } from '../../game/progress'
import { useGame } from '../../game/store'
import { BadgeEmblem } from '../../ui/BadgeShelf'
import { HudButton, Label, Panel } from '../../ui/kit'
import { usePanelShift } from '../../ui/usePanelShift'

export function ResultPanel({ meta }: { meta: ModuleMeta }) {
  const progress = useGame((s) => s.modules[meta.id])
  const last = useGame((s) => s.lastResult)
  const setPhase = useGame((s) => s.setPhase)
  const go = useGame((s) => s.go)
  const debugMode = useGame((s) => s.debugMode)
  const previewResult = useGame((s) => s.previewResult)
  usePanelShift('none')
  const score = last?.moduleId === meta.id && last.kind === 'mini' ? last.score : progress?.miniBest ?? 0
  const passed = score >= MINI_PASS
  const completed = !!progress?.completed
  const quizOk = (progress?.quizBest ?? 0) >= QUIZ_PASS
  const sample = debugMode && last?.moduleId === meta.id && last.sample

  return (
    <div className="pointer-events-none fixed inset-0 grid place-items-center p-4">
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
        <Panel className="w-[min(520px,92vw)] max-h-[calc(100dvh-150px)] overflow-y-auto p-6 md:p-8 text-center">
          <Label>TRAINING DEBRIEF</Label>
          {debugMode && <div className="mt-3 text-xs text-amber">{sample ? tr("サンプル結果") : tr("デバッグ結果")} {tr("· 成績・XP・バッジは保存されません")}</div>}
          <div className="mt-2 text-lg font-semibold">{meta.minigame.title}</div>
          <div className="mt-4 font-mono text-6xl font-light tabular-nums" style={{ color: passed ? '#52f2a4' : '#ffb547' }}>
            {Math.round(score)}
          </div>
          <div className="font-mono text-xs text-white/45">
            {tr("/ 1000・合格ライン")}{MINI_PASS}{!debugMode && trt`・自己ベスト ${progress?.miniBest ?? 0}`}
          </div>
          {last?.moduleId === meta.id && last.award.xp > 0 && <div className="mt-3 font-mono text-sm text-hud">+{last.award.xp} XP</div>}
          {completed || (sample && passed) ? (
            <div className="mt-6 flex flex-col items-center gap-2">
              <BadgeEmblem color={meta.color} index={meta.index} earned perfect={progress?.perfect} size={88} />
              <div className="text-base font-semibold">{meta.badge.name}</div>
              <div className="text-sm text-white/60">{meta.badge.description}</div>
              {debugMode && <div className="text-xs text-amber">{tr("バッジの表示サンプル")}</div>}
            </div>
          ) : (
            <p className="mt-6 text-sm leading-6 text-white/65">
              {!passed && tr("実技の合格ラインに届きませんでした。もう一度挑戦しましょう。")}
              {passed && !quizOk && (debugMode ? tr("実技は合格ラインです。全コースを引き続き自由に確認できます。") : tr("実技は合格です。モジュール修了にはクイズで70%以上の正解が必要です。"))}
            </p>
          )}
          {debugMode && <div className="mt-5 flex flex-wrap justify-center gap-2">
            <HudButton className="text-xs" onClick={() => previewResult(meta.id, 1000)}>{tr("合格結果サンプル")}</HudButton>
            <HudButton className="text-xs" onClick={() => previewResult(meta.id, 400)}>{tr("不合格結果サンプル")}</HudButton>
          </div>}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {meta.id === 'mcc' && (completed || debugMode) && <HudButton variant="primary" onClick={() => useGame.getState().graduate()}>{debugMode ? tr("修了証サンプル") : tr("修了証を受け取る")}</HudButton>}
            <HudButton onClick={() => setPhase('mini')}>{tr("実技に再挑戦")}</HudButton>
            {!quizOk && <HudButton onClick={() => setPhase('quiz')}>{tr("クイズに挑戦")}</HudButton>}
            <HudButton variant="primary" sound="confirm" onClick={() => go({ name: 'hub' })}>
              {tr("ハブに戻る")}</HudButton>
          </div>
        </Panel>
      </motion.div>
    </div>
  )
}

import { tr } from '../i18n/tr'
import { motion } from 'motion/react'
import { MODULES } from '../content/modules'
import { useGame } from '../game/store'
import { BadgeEmblem } from '../ui/BadgeShelf'
import { HudButton, Label } from '../ui/kit'
import { usePanelShift } from '../ui/usePanelShift'

export function GraduationScreen() {
  const xp = useGame((s) => s.xp)
  const modules = useGame((s) => s.modules)
  const go = useGame((s) => s.go)
  const debugMode = useGame((s) => s.debugMode)
  usePanelShift('none')
  const perfect = MODULES.filter((m) => modules[m.id]?.perfect).length
  const date = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="certificate-page pointer-events-none fixed inset-0 grid place-items-center overflow-y-auto p-4 pt-24 md:pt-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="certificate glass hud-corner pointer-events-auto w-full min-w-0 max-w-[760px] rounded-2xl p-6 text-center md:p-12"
      >
        <Label>CERTIFICATE OF COMPLETION</Label>
        {debugMode && <div className="mt-3 rounded-lg border border-amber/40 bg-amber/10 p-3 text-sm text-amber">{tr("DEBUG PREVIEW · 修了証サンプル")}<br /><span className="text-xs">{tr("表示の確認用です。学習記録・修了資格は変更されません。")}</span></div>}
        <h1 className="mt-3 text-3xl font-extralight tracking-wide md:text-5xl">
          {tr("訓練アカデミー")}<span className="font-semibold text-amber">{tr("修了")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/75">
          {debugMode ? tr("全9コースを修了すると、この修了証に獲得したバッジ・XP・成績が表示されます。以下のバッジは表示サンプルです。") : tr("あなたは宇宙飛行士候補者として、ISSシステム、宇宙医学、船外活動、ロボティクス、飛行とサバイバル、緊急事態対応、月の地質学、そして管制室総合演習の全課程を修了しました。")}
        </p>
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-9">
          {MODULES.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.12 }} className="flex justify-center">
              <BadgeEmblem color={m.color} index={m.index} earned={debugMode || !!modules[m.id]?.completed} perfect={modules[m.id]?.perfect} size={60} />
            </motion.div>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-8 font-mono text-xs text-white/55">
          <div>
            <div className="text-2xl text-hud">{xp.toLocaleString()}</div>{debugMode ? tr("保存済み XP") : 'TOTAL XP'}
          </div>
          <div>
            <div className="text-2xl text-amber">{perfect}</div>{debugMode ? tr("保存済み PERFECT") : 'PERFECT'}
          </div>
          <div>
            <div className="text-2xl text-ok">{debugMode ? 'DEMO' : 'FLIGHT'}</div>{debugMode ? 'PREVIEW' : 'ELIGIBLE'}
          </div>
        </div>
        <div className="mt-8 font-mono text-[11px] text-white/35">{tr("ASTRONAUT ACADEMY・")}{date}{tr("・非公式学習コンテンツ")}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <HudButton variant="primary" onClick={() => go({ name: 'hub' })}>
            {tr("ハブに戻る")}</HudButton>
          <HudButton onClick={() => window.print()}>{tr("修了証を保存 / 印刷")}</HudButton>
          <HudButton onClick={() => go({ name: 'credits' })}>{tr("出典とクレジット")}</HudButton>
        </div>
      </motion.div>
    </div>
  )
}

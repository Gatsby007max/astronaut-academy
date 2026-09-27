import { tr } from '../i18n/tr'
import { motion } from 'motion/react'
import { audio } from '../engine/audio'
import { completedCount } from '../game/progress'
import { useGame } from '../game/store'
import { HudButton, Label } from '../ui/kit'
import { Disclaimer } from '../ui/Disclaimer'
import { assetUrl } from '../engine/assets'
import { FeedbackDialog } from '../ui/FeedbackDialog'
import { useState } from 'react'
import { LanguageSwitch } from '../ui/LanguageSwitch'

export function TitleScreen() {
  const introSeen = useGame((s) => s.introSeen)
  const modules = useGame((s) => s.modules)
  const go = useGame((s) => s.go)
  const debugMode = useGame((s) => s.debugMode)
  const setDebugMode = useGame((s) => s.setDebugMode)
  const done = completedCount(modules)
  const [feedback, setFeedback] = useState(false)

  const start = () => {
    audio.unlock()
    go(introSeen || debugMode ? { name: 'hub' } : { name: 'intro' })
  }

  return (
    <div className="title-screen pointer-events-none fixed inset-0 flex flex-col justify-end p-6 md:justify-center md:p-16">
      <div className="absolute right-4 top-4 z-30"><LanguageSwitch /></div>
      <img className="title-photo" src={assetUrl('titleOrbit')} alt={tr("ISSの窓越しに見る夕陽と地球")} fetchPriority="high" />
      <div className="title-shade" />
      <div className="title-topline"><span>FIELD GUIDE / 01</span><span>EARTH ORBIT · TRAINING DIVISION</span></div>
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} className="relative max-w-xl">
        <Label className="mb-4">YOUR JOURNEY BEYOND EARTH</Label>
        <h1 className="text-[clamp(2.7rem,7vw,7rem)] font-extralight leading-[0.95] tracking-tight text-white">
          ASTRONAUT
          <br />
          <span className="font-semibold text-hud text-glow">ACADEMY</span>
        </h1>
        <p className="mt-4 text-lg text-white/80 md:text-xl">{tr("宇宙飛行士訓練アカデミー")}</p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
          {tr("NASAの公開資料をもとにした宇宙飛行士候補者訓練のシミュレーションで、ISSのシステム、船外活動、ロボットアーム、緊急対応、月の地質学を3Dで学びます。")}</p>
        <div className="mt-7 flex gap-8 border-y border-white/15 py-4 text-xs text-white/55"><span><b className="block text-xl text-white font-mono">09</b>{tr("訓練コース")}</span><span><b className="block text-xl text-white font-mono">90</b>{tr("レッスン")}</span><span><b className="block text-xl text-white font-mono">144</b>{tr("知識チェック")}</span></div>
        <div className="mt-8 flex flex-wrap gap-3">
          <HudButton variant="primary" sound="confirm" onClick={start} className="px-6 py-3 text-base">
            {debugMode ? tr("デバッグに戻る") : introSeen ? tr("訓練を再開する") : tr("訓練を開始する")}
          </HudButton>
          {introSeen && (
            <HudButton
              onClick={() => {
                audio.unlock()
                go({ name: 'intro' })
              }}
            >
              {tr("導入ムービー")}</HudButton>
          )}
          <HudButton onClick={() => go({ name: 'credits' })}>{tr("出典とクレジット")}</HudButton>
          <HudButton onClick={() => setFeedback(true)}>{tr("感想・参加")}</HudButton>
          <HudButton className="border-amber/35 text-amber" onClick={() => setDebugMode(!debugMode)}>{debugMode ? tr("デバッグを終了") : tr("デバッグで全て見る")}</HudButton>
        </div>
        {introSeen && <div className="mt-4 font-mono text-xs text-white/40">{tr("修了モジュール")}{done} / 9</div>}
      </motion.div>
      <div className="relative mt-10 md:absolute md:bottom-6 md:left-16 md:right-16">
        <a href="https://images.nasa.gov/details/iss071e581260_alt" target="_blank" rel="noreferrer" className="pointer-events-auto mb-2 block font-mono text-[10px] text-white/50">PHOTOGRAPH: NASA / ISS EXPEDITION 71 ↗</a>
        <Disclaimer />
      </div>
      <FeedbackDialog open={feedback} onClose={() => setFeedback(false)} />
    </div>
  )
}

import { tr } from '../i18n/tr'
import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useUi } from './uiStore'
import { InfinityFlow } from './InfinityFlow'

const TIPS = [
  tr("ISSは約90分で地球を1周します。"),
  tr("中性浮力実験室のプールには実物大のISS模型が沈んでいます。"),
  tr("宇宙飛行士候補者の基礎訓練はおよそ2年間です。"),
  tr("管制室は24時間365日、3交代でISSを見守っています。"),
  tr("月の南極には長期間にわたり直射日光が届かない永久影があります。"),
]

export function LoadingOverlay() {
  const { active, progress } = useProgress()
  const ready = useUi((s) => s.sceneReady)
  const show = active || !ready
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length))
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!show) return
    const id = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 3200)
    return () => clearInterval(id)
  }, [show])

  useEffect(() => {
    const target = ready && !active ? 100 : Math.min(progress, 99)
    const id = requestAnimationFrame(() => setShown((s) => s + (target - s) * 0.2))
    return () => cancelAnimationFrame(id)
  }, [progress, shown, ready, active])

  const tMinus = Math.max(0, Math.round(10 - shown / 10))

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading"
          className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-[#010208]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeOut' } }}
        >
          <div className="scanlines absolute inset-0 opacity-40" />
          <div className="relative flex w-[min(520px,86vw)] flex-col items-center gap-6 text-center">
            <div className="font-mono text-xs tracking-[0.5em] text-hud-dim">LAUNCH SEQUENCE</div>
            <InfinityFlow className="h-[min(25vh,180px)] w-full" dense={shown > 80} />
            <div className="font-mono text-4xl font-light tabular-nums text-hud text-glow">
              T-{String(tMinus).padStart(2, '0')}
            </div>
            <div className="h-[3px] w-full overflow-hidden rounded bg-white/10">
              <div className="h-full bg-gradient-to-r from-hud-dim via-hud to-white transition-[width] duration-200" style={{ width: `${shown}%` }} />
            </div>
            <div className="font-mono text-[11px] tracking-widest text-white/40">{Math.round(shown)}% ASSETS SYNCHRONIZED</div>
            <AnimatePresence mode="wait">
              <motion.p
                key={tip}
                className="min-h-10 text-sm text-white/70"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {TIPS[tip]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

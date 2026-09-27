import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { audio } from '../engine/audio'
import { useGame } from '../game/store'

const STYLES = {
  xp: { accent: '#7fe3ff', label: 'XP' },
  badge: { accent: '#ffd166', label: 'BADGE' },
  rank: { accent: '#52f2a4', label: 'RANK UP' },
  info: { accent: '#c9d6e8', label: 'INFO' },
} as const

export function Toasts() {
  const toasts = useGame((s) => s.toasts)
  const last = toasts[toasts.length - 1]

  useEffect(() => {
    if (!last) return
    if (last.kind === 'badge' || last.kind === 'rank') audio.sfx('badge')
  }, [last])

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-40 flex w-72 flex-col items-end gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const style = STYLES[t.kind]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, transition: { duration: 0.25 } }}
              className="glass hud-corner w-full rounded-lg px-3 py-2"
              style={{ borderColor: `${style.accent}55` }}
            >
              <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: style.accent }}>
                {style.label}
              </div>
              <div className="text-sm font-semibold text-white">{t.title}</div>
              {t.detail && <div className="text-xs text-white/60">{t.detail}</div>}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

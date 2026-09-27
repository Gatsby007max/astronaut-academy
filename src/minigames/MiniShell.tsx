import { tr } from '../i18n/tr'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { HudButton, Label, Panel } from '../ui/kit'

interface BriefingProps {
  title: string
  color: string
  lines: string[]
  controls?: string[]
  onStart: () => void
  onExit: () => void
  startLabel?: string
}

export function MiniBriefing({ title, color, lines, controls, onStart, onExit, startLabel = tr("訓練開始") }: BriefingProps) {
  return (
    <div className="pointer-events-none fixed inset-0 grid place-items-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Panel className="scroll-thin w-[min(560px,94vw)] max-h-[calc(100dvh-160px)] overflow-x-hidden overflow-y-auto p-6">
          <Label>PRACTICAL TRAINING</Label>
          <h2 className="mt-1 text-xl font-semibold" style={{ color }}>
            {title}
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-white/80">
            {lines.map((l) => (
              <li key={l} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
                <span>{l}</span>
              </li>
            ))}
          </ul>
          {controls && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
              <Label className="mb-1">CONTROLS</Label>
              <ul className="space-y-1 font-mono text-xs text-white/65">
                {controls.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <HudButton sound="back" onClick={onExit}>
              {tr("レッスンに戻る")}</HudButton>
            <HudButton variant="primary" sound="confirm" onClick={onStart}>
              {startLabel}
            </HudButton>
          </div>
        </Panel>
      </motion.div>
    </div>
  )
}

export function MiniHud({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`pointer-events-none fixed inset-x-0 top-32 flex justify-center px-3 ${className}`}>{children}</div>
}

export function FactToast({ text, ok, stamp }: { text?: string; ok?: boolean; stamp?: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={stamp}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass max-w-xl rounded-lg px-4 py-3 text-sm leading-6"
            style={{ borderColor: ok ? 'rgba(82,242,164,0.5)' : 'rgba(255,77,94,0.5)' }}
          >
            <span className={`mr-2 font-mono text-[10px] tracking-widest ${ok ? 'text-ok' : 'text-alert'}`}>{ok ? 'CONFIRMED' : 'MISMATCH'}</span>
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ScoreReadout({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-[9px] tracking-[0.3em] text-white/45">{label}</div>
      <div className="font-mono text-lg tabular-nums" style={{ color: color ?? '#fff' }}>
        {value}
      </div>
    </div>
  )
}

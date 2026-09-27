import { tr } from '../i18n/tr'
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { audio } from '../engine/audio'

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle'

const VARIANTS: Record<Variant, string> = {
  primary: 'border-hud/60 bg-hud/15 text-white hover:bg-hud/25 hover:border-hud shadow-[0_0_24px_-6px_rgba(127,227,255,0.6)]',
  ghost: 'border-white/15 bg-white/5 text-white/85 hover:border-hud/50 hover:text-white',
  danger: 'border-alert/60 bg-alert/15 text-white hover:bg-alert/25',
  subtle: 'border-transparent bg-transparent text-white/60 hover:text-white',
}

interface HudButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  sound?: 'click' | 'confirm' | 'back' | false
  children: ReactNode
}

export function HudButton({ variant = 'ghost', sound = 'click', className = '', onClick, children, ...rest }: HudButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      onPointerEnter={(e) => {
        if (!rest.disabled) audio.sfx('hover')
        rest.onPointerEnter?.(e)
      }}
      onClick={(e) => {
        audio.unlock()
        if (sound) audio.sfx(sound)
        onClick?.(e)
      }}
      className={`pointer-events-auto inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`font-mono text-[10px] uppercase tracking-[0.3em] text-hud-dim ${className}`}>{children}</div>
}

export function Meter({ value, color = '#7fe3ff', className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, background: color, boxShadow: `0 0 10px ${color}` }} />
    </div>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass hud-corner pointer-events-auto rounded-xl ${className}`}>{children}</div>
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const root = ref.current
    const selectable = () => Array.from(root?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,[tabindex="0"]') ?? [])
    selectable()[0]?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') {
        const elements=selectable(), first=elements[0], last=elements.at(-1)
        if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first?.focus() }
      }
    }
    root?.addEventListener('keydown',key)
    return () => { root?.removeEventListener('keydown',key); previous?.focus() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`glass hud-corner max-h-[86vh] w-full overflow-hidden rounded-xl ${wide ? 'max-w-4xl' : 'max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div id={titleId} className="text-sm font-semibold tracking-wide">{title}</div>
          <HudButton variant="subtle" sound="back" onClick={onClose} className="px-2 py-1">
            {tr("閉じる")}</HudButton>
        </div>
        <div className="scroll-thin max-h-[calc(86vh-52px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

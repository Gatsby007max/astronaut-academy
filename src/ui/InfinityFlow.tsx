import { tr } from '../i18n/tr'
import { useEffect, useMemo, useRef, useState } from 'react'
import { attractorPath } from '../engine/particles/attractor'
import { createInfinityRenderer } from '../engine/particles/infinityRenderer'
import { useGame } from '../game/store'

export function InfinityFlow({ className = '', paused = false, speed = 1, dense = false }: { className?: string; paused?: boolean; speed?: number; dense?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const motion = useGame(s => s.settings.particleMotion)
  const state = useRef({ paused, speed, dense, motion })
  state.current = { paused, speed, dense, motion }
  const invalidate = useRef<() => void>(() => {})
  const [fallback, setFallback] = useState(false)
  const [revision, setRevision] = useState(0)
  const fallbackDots = useMemo(() => {
    const p = attractorPath()
    return Array.from({ length: p.length / 4 }, (_, i) => `M${p[i * 4].toFixed(3)},${(-p[i * 4 + 1]).toFixed(3)}h.001`).join('')
  }, [])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let renderer: ReturnType<typeof createInfinityRenderer>
    try { renderer = createInfinityRenderer(element) } catch { renderer = null }
    if (!renderer) { setFallback(true); element.dataset.flowStatus = 'fallback'; return }
    setFallback(false)
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, time = 0, last = 0, density = state.current.dense ? 1 : 0, disposed = false, lost = false
    const schedule = () => { if (!disposed && !lost && !document.hidden && !frame) frame = requestAnimationFrame(draw) }
    const draw = (now: number) => {
      frame = 0
      const active = state.current.motion && !state.current.paused && !media.matches
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      if (active) time += dt * state.current.speed
      const target = state.current.dense ? 1 : 0
      density = media.matches ? target : density + (target - density) * (1 - Math.exp(-dt * 5))
      renderer!.render(time, density)
      element.dataset.flowStatus = active ? 'flowing' : 'paused'
      if (active || Math.abs(target - density) > 0.002) schedule()
    }
    const visibility = () => { cancelAnimationFrame(frame); frame = 0; last = 0; schedule() }
    const onLost = (event: Event) => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0; element.dataset.flowStatus = 'context-lost' }
    const onRestored = () => setRevision(value => value + 1)
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    media.addEventListener('change', schedule)
    document.addEventListener('visibilitychange', visibility)
    element.addEventListener('webglcontextlost', onLost)
    element.addEventListener('webglcontextrestored', onRestored)
    invalidate.current = schedule
    schedule()
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); renderer?.dispose()
      media.removeEventListener('change', schedule); document.removeEventListener('visibilitychange', visibility)
      element.removeEventListener('webglcontextlost', onLost); element.removeEventListener('webglcontextrestored', onRestored)
      invalidate.current = () => {}
    }
  }, [revision])
  useEffect(() => invalidate.current(), [paused, speed, dense, motion])

  return <div className={`infinity-flow ${className}`} role="img" aria-label={tr("二つの渦を巡る無限大の点群アニメーション")}>
    <canvas ref={canvas} aria-hidden className={`h-full w-full ${fallback ? 'invisible' : ''}`} />
    {fallback && <svg className="absolute inset-0 h-full w-full" viewBox="-1.5 -0.9 3 1.8" aria-hidden><path d={fallbackDots} stroke="#dbe6ef" strokeWidth=".008" strokeLinecap="round" opacity=".7" fill="none" /></svg>}
  </div>
}

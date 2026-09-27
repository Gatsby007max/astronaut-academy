import { PerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { ACESFilmicToneMapping, NoToneMapping, type Material, type Mesh } from 'three'
import { useGame } from '../game/store'
import { useUi } from '../ui/uiStore'
import { stepTier, TIERS } from './quality'

export function QualityManager({ active }: { active: boolean }) {
  const ready = useUi(s => s.sceneReady)
  const [warmed, setWarmed] = useState(false)
  const lastChange = useRef(0)
  useEffect(() => { setWarmed(false); if (!ready || !active) return; const timer = setTimeout(() => setWarmed(true), 6000); return () => clearTimeout(timer) }, [ready, active])
  const tier = useGame((s) => s.tier)
  const auto = useGame((s) => s.settings.quality === 'auto')
  const setTier = useGame((s) => s.setTier)
  const { gl, scene, setDpr } = useThree()
  const factor = useRef(0.75)
  const config = TIERS[tier]

  useEffect(() => {
    const [min, max] = config.dpr
    const device = Math.min(window.devicePixelRatio || 1, max)
    setDpr(Math.max(min, min + (device - min) * factor.current))
  }, [config, setDpr])

  useEffect(() => {
    const wanted = config.post ? NoToneMapping : ACESFilmicToneMapping
    gl.shadowMap.enabled = config.shadows
    if (gl.toneMapping !== wanted) {
      gl.toneMapping = wanted
      scene.traverse((object) => {
        const material = (object as Mesh).material as Material | Material[] | undefined
        if (!material) return
        for (const m of Array.isArray(material) ? material : [material]) m.needsUpdate = true
      })
    }
  }, [config, gl, scene])

  const adjust = (direction: 1 | -1) => {
    if (!auto || performance.now() - lastChange.current < 10000) return
    lastChange.current = performance.now()
    setTier(stepTier(useGame.getState().tier, direction))
  }
  if (!auto || !warmed || !active) return null
  return (
    <PerformanceMonitor
      bounds={(refresh) => (refresh > 90 ? [55, 110] : [42, 58])}
      flipflops={4}
      onChange={({ factor: f }) => {
        factor.current = f
        const [min, max] = config.dpr
        const device = Math.min(window.devicePixelRatio || 1, max)
        setDpr(Math.max(min, min + (device - min) * f))
      }}
      onDecline={() => adjust(-1)}
      onIncline={() => adjust(1)}
      onFallback={() => adjust(-1)}
    />
  )
}

import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode, type BloomEffect, type ChromaticAberrationEffect, type NoiseEffect, type VignetteEffect, type DepthOfFieldEffect } from 'postprocessing'
import { useMemo, useRef } from 'react'
import { Vector2 } from 'three'
import { useGame } from '../game/store'
import { useFx } from './fx'
import { TIERS } from './quality'

export function PostFX() {
  const tier = useGame((s) => s.tier)
  const dofEnabled = useFx((s) => s.dofEnabled)
  const config = TIERS[tier]
  const bloom = useRef<BloomEffect>(null)
  const chroma = useRef<ChromaticAberrationEffect>(null)
  const vignette = useRef<VignetteEffect>(null)
  const noise = useRef<NoiseEffect>(null)
  const dof = useRef<DepthOfFieldEffect>(null)
  const chromaOffset = useMemo(() => new Vector2(0, 0), [])

  useFrame(() => {
    const fx = useFx.getState()
    if (bloom.current) {
      bloom.current.intensity = Math.min(fx.bloomIntensity, .45)
      bloom.current.luminanceMaterial.threshold = Math.max(fx.bloomThreshold, 1.1)
      bloom.current.luminanceMaterial.smoothing = fx.bloomSmoothing
    }
    if (chroma.current) chroma.current.offset.set(0, 0)
    if (vignette.current) vignette.current.darkness = fx.vignette
    if (noise.current) noise.current.blendMode.opacity.value = fx.noise
    if (dof.current) {
      dof.current.cocMaterial.focusDistance = fx.dofFocus
      dof.current.cocMaterial.focusRange = fx.dofRange
      dof.current.bokehScale = fx.dofBokeh
    }
  })

  if (!config.post) return null

  const ultra = tier === 'ultra'
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {config.dof && dofEnabled ? <DepthOfField ref={dof} focusDistance={8} focusRange={6} bokehScale={3} /> : <></>}
      <Bloom ref={bloom} mipmapBlur intensity={0.9} luminanceThreshold={0.72} luminanceSmoothing={0.25} radius={0.78} levels={ultra ? 8 : 6} />
      {config.filmic ? <ChromaticAberration ref={chroma} offset={chromaOffset} radialModulation modulationOffset={0.35} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {config.filmic ? <Vignette ref={vignette} offset={0.28} darkness={0.55} eskil={false} /> : <></>}
      {config.filmic ? <Noise ref={noise} premultiply blendFunction={BlendFunction.SCREEN} opacity={0.035} /> : <></>}
      <SMAA />
    </EffectComposer>
  )
}

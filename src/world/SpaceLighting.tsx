import { Environment, Lightformer } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import type { DirectionalLight, Vector3 } from 'three'
import { TIERS } from '../engine/quality'
import { useGame } from '../game/store'

interface SpaceLightingProps {
  sunDir: Vector3
  intensity?: number
  earthDir?: [number, number, number]
  shadowExtent?: number
}

export function SpaceLighting({ sunDir, intensity = 3.2, earthDir = [0, -1, 0], shadowExtent = 3 }: SpaceLightingProps) {
  const tier = useGame((s) => s.tier)
  const config = TIERS[tier]
  const light = useRef<DirectionalLight>(null)
  const pos = sunDir.clone().multiplyScalar(40)

  useEffect(() => {
    const l = light.current
    if (!l) return
    l.shadow.mapSize.set(config.shadowMapSize, config.shadowMapSize)
    l.shadow.map?.dispose()
    l.shadow.map = null
  }, [config.shadowMapSize])

  const earth = earthDir.map((v) => v * 20) as [number, number, number]
  const sun = sunDir.clone().multiplyScalar(20).toArray()
  return (
    <>
      <directionalLight
        ref={light}
        position={pos}
        intensity={intensity}
        color="#fff4e6"
        castShadow={config.shadows}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      <hemisphereLight args={['#0b1220', '#2d5b9a', 0.35]} />
      <Environment resolution={tier === 'low' ? 64 : 256} frames={1}>
        <color attach="background" args={['#000000']} />
        <Lightformer form="circle" intensity={12} position={sun} scale={4} color="#fff2dc" />
        <Lightformer form="rect" intensity={2.2} position={earth} rotation-x={Math.PI / 2} scale={[60, 60, 1]} color="#6aa6ff" />
        <Lightformer form="ring" intensity={0.6} position={[0, 0, -20]} scale={10} color="#9ac7ff" />
      </Environment>
    </>
  )
}

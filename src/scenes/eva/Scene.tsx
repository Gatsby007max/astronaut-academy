import { Environment, Lightformer } from '@react-three/drei'
import { useMemo } from 'react'
import { Vector3 } from 'three'
import { CameraRig } from '../../engine/CameraRig'
import { TIERS } from '../../engine/quality'
import { useSceneSetup } from '../../engine/useSceneSetup'
import { useGame } from '../../game/store'
import { EVA_SHOTS, SUIT_HOME } from './layout'
import { IssMockup } from './Mockup'
import { Bubbles, Particulates, type Emitter } from './Particles'
import { GodRays, PoolShell, WaterFog } from './Pool'
import { Diver, Suit } from './Suit'

const DIVERS: [number, number, number][] = [
  [-1.4, -5.4, 1.4],
  [2.6, -6.2, -0.8],
]

export default function EvaScene() {
  const phase = useGame((s) => (s.screen.name === 'module' ? s.screen.phase : 'brief'))
  const focus = useGame((s) => s.focus)
  const tier = useGame((s) => s.tier)
  const config = TIERS[tier]
  const weighing = phase === 'mini' && focus === 'weigh'

  useSceneSetup({
    near: 0.05,
    far: 120,
    fov: 50,
    ambient: 'underwater',
    fx: { bloomThreshold: 1.1, bloomIntensity: 0.4, vignette: 0.72, noise: 0.045, chroma: 0.0012 },
  })

  const emitters = useMemo<Emitter[]>(
    () => [
      ...DIVERS.map((d) => ({ position: new Vector3(d[0], d[1] + 0.6, d[2] + 0.3), rate: 3.5 })),
      { position: new Vector3(SUIT_HOME[0], SUIT_HOME[1] + 1.1, SUIT_HOME[2] - 0.2), rate: 1.2 },
      { position: new Vector3(-9, -11.5, -10), rate: 1.5 },
    ],
    [],
  )

  return (
    <>
      <WaterFog density={0.052} />
      <hemisphereLight args={['#9fe6ff', '#0a2a3a', 0.9]} />
      <directionalLight
        position={[6, 20, 4]}
        intensity={2.4}
        color="#d9f6ff"
        castShadow={config.shadows}
        shadow-mapSize={[config.shadowMapSize, config.shadowMapSize]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0005}
      />
      <pointLight position={[0.6, -3.6, 2.6]} intensity={6} distance={9} color="#fff1dc" />
      <Environment resolution={tier === 'low' ? 32 : 128} frames={1}>
        <color attach="background" args={['#0b5270']} />
        <Lightformer form="rect" intensity={3} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} color="#bff2ff" />
        <Lightformer form="rect" intensity={0.8} position={[0, -10, 0]} rotation-x={-Math.PI / 2} scale={[30, 30, 1]} color="#1b6f8a" />
      </Environment>

      <PoolShell />
      <IssMockup />
      <GodRays count={tier === 'low' ? 5 : 10} />
      <Particulates count={Math.round(700 * config.particles)} />
      <Bubbles emitters={emitters} max={Math.round(260 * config.particles)} />
      <Suit simulate={weighing} />
      {DIVERS.map((d, i) => (
        <Diver key={i} position={d} phase={i * 2.1} />
      ))}

      <CameraRig shots={EVA_SHOTS} drift={phase === 'mini' ? 0.004 : 0.012} parallax={0.18} smooth={0.9} />
    </>
  )
}

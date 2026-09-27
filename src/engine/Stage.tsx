import { tr } from '../i18n/tr'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { NoToneMapping, PCFShadowMap, PerspectiveCamera, SRGBColorSpace } from 'three'
import type { ModuleId } from '../content/types'
import { useGame, type Screen } from '../game/store'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { useUi } from '../ui/uiStore'
import { registerCapture } from './capture'
import { PostFX } from './PostFX'
import { QualityManager } from './QualityManager'
import { ParticleWorld } from './ParticleWorld'

export type SceneKey = 'orbit' | Exclude<ModuleId, 'orientation'>

const sceneFiles = import.meta.glob<{ default: ComponentType }>('../scenes/*/Scene.tsx')
const scenes: Partial<Record<SceneKey, LazyExoticComponent<ComponentType>>> = {}
for (const [path, load] of Object.entries(sceneFiles)) {
  const key = path.split('/')[2] as SceneKey
  scenes[key] = lazy(load)
}

export function sceneFor(screen: Screen): SceneKey {
  if (screen.name !== 'module' || screen.id === 'orientation') return 'orbit'
  return scenes[screen.id] ? screen.id : 'orbit'
}

function SceneRouter() {
  const key = useGame((s) => sceneFor(s.screen))
  const Scene = scenes[key] ?? scenes.orbit
  if (!Scene) return null
  return (
    <ErrorBoundary resetKey={key} fallback={() => <SceneFailed />}>
      <ParticleWorld key={key}><Scene /></ParticleWorld>
    </ErrorBoundary>
  )
}

function SceneFailed() {
  useEffect(() => {
    useUi.getState().setSceneReady(true)
    useGame.getState().pushToast({ kind: 'info', title: tr("3Dシーンを表示できませんでした"), detail: tr("グラフィック設定を「低」にすると改善する場合があります。") })
  }, [])
  return null
}

function ViewShift() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const current = useRef({ x: 0, y: 0 })

  useFrame((_, delta) => {
    const target = useUi.getState().viewShift
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 5)
    current.current.x += (target.x - current.current.x) * k
    current.current.y += (target.y - current.current.y) * k
    const sx = current.current.x * size.width
    const sy = current.current.y * size.height
    if (Math.abs(sx) < 0.5 && Math.abs(sy) < 0.5) {
      if (camera.view?.enabled) {
        camera.clearViewOffset()
        camera.aspect = size.width / size.height
        camera.updateProjectionMatrix()
      }
      return
    }
    const fullW = size.width + 2 * Math.abs(sx)
    const fullH = size.height + 2 * Math.abs(sy)
    camera.aspect = fullW / fullH
    camera.setViewOffset(fullW, fullH, sx > 0 ? 2 * sx : 0, sy > 0 ? 2 * sy : 0, size.width, size.height)
  })

  return null
}

function CaptureBridge() {
 const {gl, scene, camera} = useThree()
 useEffect(() => registerCapture(() => {
  gl.render(scene, camera)
  return gl.domElement.toDataURL('image/png')
 }), [gl, scene, camera])
 return null
}

function SettleFrames({ active }: { active: boolean }) {
 const invalidate = useThree(s => s.invalidate)
 const focus = useGame(s => s.focus)
 const screen = useGame(s => s.screen)
 const tier = useGame(s => s.tier)
 const until = useRef(0)
 useEffect(() => { until.current = performance.now() + 2500; invalidate() }, [focus, screen, tier, invalidate])
 useFrame(() => { if (!active && performance.now() < until.current) invalidate() })
 return null
}

export function Stage() {
  const screen = useGame(s => s.screen)
  const active = screen.name === 'intro' || screen.name === 'hub' || (screen.name === 'module' && screen.phase !== 'result')
  const [visible, setVisible] = useState(() => !document.hidden)
  const shadows = useMemo(() => ({ type: PCFShadowMap }), [])

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return (
    <Canvas
      className="!fixed inset-0"
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false }}
      dpr={1}
      shadows={shadows}
      frameloop={visible ? (active ? 'always' : 'demand') : 'never'}
      camera={{ fov: 42, near: 0.05, far: 20000, position: [0, 0, 12] }}
      onCreated={({ gl }) => {
        gl.toneMapping = NoToneMapping
        gl.outputColorSpace = SRGBColorSpace
      }}
    >
      <color attach="background" args={['#010208']} />
      <Suspense fallback={null}>
        <SceneRouter />
      </Suspense>
      <PostFX />
      <CaptureBridge />
      <QualityManager active={active} />
      <SettleFrames active={active} />
      <ViewShift />
    </Canvas>
  )
}

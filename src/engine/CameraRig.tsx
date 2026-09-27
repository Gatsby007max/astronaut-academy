import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { useEffect, useMemo, useRef } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useGame } from '../game/store'

export type Vec3 = [number, number, number]

export interface Shot {
  position: Vec3
  target: Vec3
  fov?: number
}

interface CameraRigProps {
  shots: Record<string, Shot>
  focus?: string
  interactive?: boolean
  smooth?: number
  drift?: number
  parallax?: number
  minDistance?: number
  maxDistance?: number
  maxPolarAngle?: number
  enablePan?: boolean
}

export function CameraRig({
  shots,
  focus: focusOverride,
  interactive = false,
  smooth = 0.6,
  drift = 0.015,
  parallax = 0.25,
  minDistance = 0.5,
  maxDistance = 200,
  maxPolarAngle = Math.PI,
  enablePan = false,
}: CameraRigProps) {
  const storeFocus = useGame((s) => s.focus)
  const focus = focusOverride ?? storeFocus
  const shot = shots[focus] ?? shots.overview ?? Object.values(shots)[0]
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const controls = useRef<OrbitControlsImpl>(null)
  const lookAt = useRef(new Vector3(...shot.target))
  const transitioning = useRef(true)
  const tmp = useMemo(() => ({ pos: new Vector3(), target: new Vector3() }), [])

  useEffect(() => {
    transitioning.current = true
  }, [shot])

  useEffect(() => {
    const c = controls.current
    if (!c) return
    const stop = () => (transitioning.current = false)
    c.addEventListener('start', stop)
    return () => c.removeEventListener('start', stop)
  }, [interactive])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    tmp.pos.set(...shot.position)
    tmp.target.set(...shot.target)
    if (shot.fov && Math.abs(camera.fov - shot.fov) > 0.01) {
      camera.fov += (shot.fov - camera.fov) * (1 - Math.exp(-dt * 3))
      camera.updateProjectionMatrix()
    }
    if (interactive && controls.current) {
      if (!transitioning.current) return
      easing.damp3(camera.position, tmp.pos, smooth, dt)
      easing.damp3(controls.current.target, tmp.target, smooth, dt)
      controls.current.update()
      if (camera.position.distanceTo(tmp.pos) < 0.01 && controls.current.target.distanceTo(tmp.target) < 0.01) transitioning.current = false
      return
    }
    const t = state.clock.elapsedTime
    const span = tmp.pos.distanceTo(tmp.target)
    tmp.pos.x += Math.sin(t * 0.21) * drift * span + state.pointer.x * parallax * span * 0.1
    tmp.pos.y += Math.cos(t * 0.17) * drift * span * 0.6 + state.pointer.y * parallax * span * 0.06
    easing.damp3(camera.position, tmp.pos, smooth, dt)
    easing.damp3(lookAt.current, tmp.target, smooth, dt)
    camera.lookAt(lookAt.current)
  })

  if (!interactive) return null
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={enablePan}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={maxPolarAngle}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
    />
  )
}

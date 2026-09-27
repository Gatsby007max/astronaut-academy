import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { useFx, type FxState } from './fx'
import type { Shot } from './CameraRig'

export interface CineShot {
  duration: number
  from: Shot
  to: Shot
  ease?: 'inOut' | 'out' | 'in' | 'linear'
  fx?: Partial<Pick<FxState, 'dofFocus' | 'dofRange' | 'dofBokeh' | 'bloomIntensity' | 'vignette' | 'chroma'>>
  caption?: { title: string; subtitle?: string }
}

const eases = {
  linear: (t: number) => t,
  in: (t: number) => t * t * t,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
}

interface CinematicProps {
  shots: CineShot[]
  playing: boolean
  onShot?: (index: number, shot: CineShot) => void
  onDone?: () => void
}

export function Cinematic({ shots, playing, onShot, onDone }: CinematicProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const elapsed = useRef(0)
  const current = useRef(-1)
  const done = useRef(false)
  const a = useRef(new Vector3())
  const b = useRef(new Vector3())

  useFrame((_, delta) => {
    if (!playing || done.current) return
    elapsed.current += Math.min(delta, 0.05)
    let t = elapsed.current
    let index = 0
    while (index < shots.length && t > shots[index].duration) {
      t -= shots[index].duration
      index++
    }
    if (index >= shots.length) {
      done.current = true
      onDone?.()
      return
    }
    const shot = shots[index]
    if (index !== current.current) {
      current.current = index
      if (shot.fx) useFx.getState().set(shot.fx)
      onShot?.(index, shot)
    }
    const k = eases[shot.ease ?? 'inOut'](MathUtils.clamp(t / shot.duration, 0, 1))
    a.current.fromArray(shot.from.position).lerp(b.current.fromArray(shot.to.position), k)
    camera.position.copy(a.current)
    a.current.fromArray(shot.from.target).lerp(b.current.fromArray(shot.to.target), k)
    camera.lookAt(a.current)
    const fov = MathUtils.lerp(shot.from.fov ?? camera.fov, shot.to.fov ?? shot.from.fov ?? camera.fov, k)
    if (Math.abs(fov - camera.fov) > 0.001) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}

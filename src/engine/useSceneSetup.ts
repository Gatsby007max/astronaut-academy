import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { PerspectiveCamera } from 'three'
import { useUi } from '../ui/uiStore'
import { audio, type Ambient } from './audio'
import { useFx, type FxState } from './fx'

interface SceneSetup {
  near: number
  far: number
  fov?: number
  ambient?: Ambient
  fx?: Partial<Omit<FxState, 'set' | 'reset'>>
}

export function useSceneSetup({ near, far, fov, ambient = 'none', fx }: SceneSetup) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const fxKey = JSON.stringify(fx ?? {})

  useEffect(() => {
    camera.near = near
    camera.far = far
    if (fov) camera.fov = fov
    camera.updateProjectionMatrix()
  }, [camera, near, far, fov])

  useEffect(() => {
    const store = useFx.getState()
    store.reset()
    if (fx) store.set(fx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fxKey])

  useEffect(() => {
    audio.ambient(ambient)
  }, [ambient])

  useEffect(() => {
    const frame = requestAnimationFrame(() => useUi.getState().setSceneReady(true))
    return () => {
      cancelAnimationFrame(frame)
      useUi.getState().setSceneReady(false)
    }
  }, [])
}

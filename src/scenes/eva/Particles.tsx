import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, InstancedMesh, Object3D, Points, Vector3 } from 'three'
import { softParticleTexture } from '../../engine/textures'

export interface Emitter {
  position: Vector3 | (() => Vector3)
  rate: number
}

export function Bubbles({ emitters, max = 220 }: { emitters: Emitter[]; max?: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const state = useMemo(
    () => ({
      pos: Array.from({ length: max }, () => new Vector3(0, -100, 0)),
      vel: new Float32Array(max),
      size: new Float32Array(max),
      phase: new Float32Array(max),
      next: 0,
      carry: emitters.map(() => 0),
    }),
    [max, emitters],
  )
  const dummy = useMemo(() => new Object3D(), [])

  useFrame(({ clock }, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 0.05)
    emitters.forEach((e, ei) => {
      state.carry[ei] += e.rate * dt
      while (state.carry[ei] >= 1) {
        state.carry[ei] -= 1
        const i = state.next++ % max
        const origin = typeof e.position === 'function' ? e.position() : e.position
        state.pos[i].copy(origin).add(new Vector3((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15))
        state.vel[i] = 0.6 + Math.random() * 0.7
        state.size[i] = 0.012 + Math.random() * 0.03
        state.phase[i] = Math.random() * 6.28
      }
    })
    const t = clock.elapsedTime
    for (let i = 0; i < max; i++) {
      const p = state.pos[i]
      if (p.y < -50) {
        dummy.position.set(0, -100, 0)
        dummy.scale.setScalar(0.0001)
      } else {
        p.y += state.vel[i] * dt
        p.x += Math.sin(t * 3 + state.phase[i]) * 0.004
        p.z += Math.cos(t * 2.4 + state.phase[i]) * 0.004
        if (p.y > -0.05) p.y = -100
        dummy.position.copy(p)
        const s = state.size[i] * (1 + Math.max(0, p.y + 12) * 0.04)
        dummy.scale.set(s, s * 0.8, s)
      }
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh userData={{ particleImportance: 0.025 }} ref={mesh} args={[undefined, undefined, max]} frustumCulled={false} renderOrder={4}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color="#e8fbff" roughness={0.05} metalness={0.1} transparent opacity={0.55} emissive="#9ee9ff" emissiveIntensity={0.35} depthWrite={false} />
    </instancedMesh>
  )
}

export function Particulates({ count = 700, radius = 14 }: { count?: number; radius?: number }) {
  const points = useRef<Points>(null)
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * radius * 2
      arr[i * 3 + 1] = -Math.random() * 12
      arr[i * 3 + 2] = (Math.random() - 0.5) * radius * 2
    }
    g.setAttribute('position', new BufferAttribute(arr, 3))
    return g
  }, [count, radius])
  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.elapsedTime * 0.01
      points.current.position.y = Math.sin(clock.elapsedTime * 0.1) * 0.2
    }
  })
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial map={softParticleTexture()} size={0.06} sizeAttenuation transparent opacity={0.4} color="#bfefff" depthWrite={false} blending={AdditiveBlending} />
    </points>
  )
}

import { trt } from '../../i18n/tr'
import { Html, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { Box3, Group, MathUtils, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { assetUrl } from '../../engine/assets'
import { MOUNTS, STEP_KG, trimFor, useBuoyancy, type Mount } from '../../minigames/buoyancy'
import { SUIT_HOME } from './layout'

const SUIT_HEIGHT = 1.9
const MOUNT_OFFSETS: Record<Mount, [number, number, number]> = {
  front: [0, 0.35, 0.32],
  back: [0, 0.35, -0.42],
  left: [0.2, -0.6, 0.05],
  right: [-0.2, -0.6, 0.05],
}

function useSuitModel() {
  const gltf = useGLTF(assetUrl('emu'))
  return useMemo(() => {
    const root = gltf.scene.clone(true)
    const box = new Box3().setFromObject(root)
    const size = box.getSize(new Vector3())
    const scale = SUIT_HEIGHT / size.y
    const center = box.getCenter(new Vector3())
    root.scale.setScalar(scale)
    root.position.copy(center).multiplyScalar(-scale)
    root.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      const m = mesh.material as MeshStandardMaterial
      m.envMapIntensity = 0.9
    })
    return root
  }, [gltf])
}

export function Suit({ simulate }: { simulate: boolean }) {
  const model = useSuitModel()
  const group = useRef<Group>(null)
  const motion = useRef({ v: 0, pitchV: 0, rollV: 0 })
  const loadout = useBuoyancy((s) => s.loadout)
  const finished = useBuoyancy((s) => s.finishedAt)

  useFrame(({ clock }, delta) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    if (!simulate) {
      g.position.set(SUIT_HOME[0], SUIT_HOME[1] + Math.sin(t * 0.5) * 0.06, SUIT_HOME[2])
      g.rotation.set(Math.sin(t * 0.3) * 0.04, t * 0.05, Math.sin(t * 0.37) * 0.03)
      return
    }
    const s = useBuoyancy.getState()
    const trim = trimFor(s.initial, s.loadout)
    const m = motion.current
    const settle = s.finishedAt ? 6 : 1
    m.v += (trim.buoyancy * 0.22 - m.v * 1.6 * settle) * dt
    g.position.y = MathUtils.clamp(g.position.y + m.v * dt, SUIT_HOME[1] - 1.0, SUIT_HOME[1] + 1.0)
    if (g.position.y <= SUIT_HOME[1] - 1.0 || g.position.y >= SUIT_HOME[1] + 1.0) m.v *= -0.2
    const targetPitch = MathUtils.clamp(trim.pitch * 0.45, -1.1, 1.1)
    const targetRoll = MathUtils.clamp(trim.roll * 0.45, -1.1, 1.1)
    m.pitchV += ((targetPitch - g.rotation.x) * 1.4 - m.pitchV * 1.8) * dt
    m.rollV += ((targetRoll - g.rotation.z) * 1.4 - m.rollV * 1.8) * dt
    g.rotation.x += m.pitchV * dt
    g.rotation.z += m.rollV * dt
    g.rotation.y = MathUtils.damp(g.rotation.y, 0, 2, dt)
    g.position.x = MathUtils.damp(g.position.x, SUIT_HOME[0], 2, dt)
    g.position.z = MathUtils.damp(g.position.z, SUIT_HOME[2], 2, dt)
  })

  return (
    <group ref={group} position={SUIT_HOME} userData={{ particleImportance: 8 }}>
      <group rotation-y={Math.PI}><primitive object={model} /></group>
      {simulate &&
        MOUNTS.map((mount) => {
          const n = loadout[mount.id]
          return (
            <Html key={mount.id} position={MOUNT_OFFSETS[mount.id]} center zIndexRange={[25, 15]}>
              <div className={`pointer-events-none whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] backdrop-blur ${finished ? 'border-ok/60 text-ok' : 'border-hud/50 text-hud'} bg-black/40`}>
                {mount.label} {n > 0 ? trt`錘 ${(n * STEP_KG).toFixed(1)}kg` : n < 0 ? trt`浮き ${(-n * STEP_KG).toFixed(1)}kg` : '—'}
              </div>
            </Html>
          )
        })}
    </group>
  )
}

export function Diver({ position, phase = 0 }: { position: [number, number, number]; phase?: number }) {
  const group = useRef<Group>(null)
  const finL = useRef<Group>(null)
  const finR = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(t * 0.7) * 0.12
      group.current.rotation.y = Math.sin(t * 0.15) * 0.3 + phase
    }
    if (finL.current) finL.current.rotation.x = Math.sin(t * 2.2) * 0.35
    if (finR.current) finR.current.rotation.x = -Math.sin(t * 2.2) * 0.35
  })
  return (
    <group ref={group} position={position}>
      <group rotation-x={-1.2}>
        <mesh castShadow>
          <capsuleGeometry args={[0.2, 0.9, 6, 12]} />
          <meshStandardMaterial color="#10161c" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.72, 0.02]}>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color="#1a232b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.72, 0.14]}>
          <boxGeometry args={[0.18, 0.08, 0.04]} />
          <meshStandardMaterial color="#8fd7ff" metalness={0.6} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.15, -0.26]}>
          <cylinderGeometry args={[0.1, 0.1, 0.7, 12]} />
          <meshStandardMaterial color="#e3b13a" metalness={0.5} roughness={0.35} />
        </mesh>
        {[
          [finL, 0.1],
          [finR, -0.1],
        ].map(([ref, x], i) => (
          <group key={i} ref={ref as RefObject<Group>} position={[x as number, -0.75, 0]}>
            <mesh position={[0, -0.25, 0]}>
              <boxGeometry args={[0.14, 0.5, 0.02]} />
              <meshStandardMaterial color="#1c5b8a" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

useGLTF.preload(assetUrl('emu'))

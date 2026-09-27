import { useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

const HANDRAIL = new MeshStandardMaterial({ color: '#d9a623', roughness: 0.45, metalness: 0.2 })
const SHELL = new MeshStandardMaterial({ color: '#e7ecef', roughness: 0.55, metalness: 0.15 })
const PANEL = new MeshStandardMaterial({ color: '#a9b4bb', roughness: 0.7, metalness: 0.3 })
const DARK = new MeshStandardMaterial({ color: '#39434b', roughness: 0.6, metalness: 0.4 })

function Handrails({ length, radius, count = 4 }: { length: number; radius: number; count?: number }) {
  const rails = useMemo(() => Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2 + 0.3), [count])
  return (
    <>
      {rails.map((a, i) => (
        <group key={i} rotation-x={a}>
          <mesh position={[0, radius + 0.12, 0]} rotation-z={Math.PI / 2} material={HANDRAIL} castShadow>
            <cylinderGeometry args={[0.025, 0.025, length * 0.8, 6]} />
          </mesh>
          {[-0.35, 0, 0.35].map((f) => (
            <mesh key={f} position={[f * length, radius + 0.06, 0]} material={HANDRAIL}>
              <boxGeometry args={[0.03, 0.12, 0.03]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

function ModuleMock({ length, radius, position, rotation = [0, 0, 0] }: { length: number; radius: number; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation-z={Math.PI / 2} material={SHELL} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, length, 40, 1]} />
      </mesh>
      {[-0.42, -0.14, 0.14, 0.42].map((f) => (
        <mesh key={f} position={[f * length, 0, 0]} rotation-z={Math.PI / 2} material={PANEL}>
          <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.12, 40, 1]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * length) / 2, 0, 0]} rotation-z={(s * Math.PI) / 2} material={PANEL}>
          <cylinderGeometry args={[radius * 0.55, radius, 0.6, 32, 1]} />
        </mesh>
      ))}
      <Handrails length={length} radius={radius} />
    </group>
  )
}

export function IssMockup() {
  return (
    <group position={[-3, -12.2, -11]}>
      <ModuleMock length={8.5} radius={2.1} position={[0, 2.3, 0]} />
      <ModuleMock length={6} radius={2.1} position={[6.8, 2.3, 0]} rotation={[0, 0, 0]} />
      <ModuleMock length={5} radius={1.7} position={[3.3, 2.3, -4.2]} rotation={[0, Math.PI / 2, 0]} />
      <group position={[-6.4, 2.3, 0]}>
        <mesh rotation-z={Math.PI / 2} material={SHELL} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 3.2, 32]} />
        </mesh>
        <mesh position={[-1.65, 0, 0]} rotation-z={Math.PI / 2} material={DARK}>
          <cylinderGeometry args={[0.55, 0.55, 0.12, 24]} />
        </mesh>
        <mesh position={[-1.72, 0, 0]} rotation-z={Math.PI / 2} material={HANDRAIL}>
          <torusGeometry args={[0.62, 0.03, 8, 32]} />
        </mesh>
      </group>
      <group position={[2, 6.4, -1]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[i * 1.6 - 5, 0, 0]} material={DARK} castShadow>
            <boxGeometry args={[1.5, 0.08, 0.08]} />
          </mesh>
        ))}
        <mesh material={PANEL} castShadow>
          <boxGeometry args={[11, 0.9, 0.9]} />
        </mesh>
      </group>
      {[-4, 0, 4, 8].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]} material={DARK} receiveShadow>
          <boxGeometry args={[0.4, 0.3, 4.4]} />
        </mesh>
      ))}
    </group>
  )
}
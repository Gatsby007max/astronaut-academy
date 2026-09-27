import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector2, type Mesh, type Texture, type Vector3 } from 'three'
import { assetUrl, tieredTexture } from '../engine/assets'
import { TIERS } from '../engine/quality'
import { useProgressiveTexture } from '../engine/useProgressiveTexture'
import { useGame } from '../game/store'

interface MoonProps {
  position: Vector3 | [number, number, number]
  radius: number
  spin?: number
  rotation?: [number, number, number]
}

function MoonSphere({ position, radius, spin = 0, rotation = [0, -Math.PI / 2, 0], color, normal, segments }: MoonProps & { color: Texture; normal?: Texture; segments: number }) {
  const mesh = useRef<Mesh>(null)
  const normalScale = useMemo(() => new Vector2(1.4, 1.4), [])
  useFrame((_, delta) => {
    if (mesh.current && spin) mesh.current.rotation.y += delta * spin
  })
  return (
    <mesh ref={mesh} position={position} rotation={rotation} userData={{ particleRole: 'planet' }}>
      <sphereGeometry args={[radius, segments, segments / 2]} />
      <meshStandardMaterial map={color} normalMap={normal ?? null} normalScale={normalScale} roughness={1} metalness={0} />
    </mesh>
  )
}

export function Moon(props: MoonProps) {
  const color = useProgressiveTexture(assetUrl('moonColor2k'))
  return <MoonSphere {...props} color={color} segments={96} />
}

export function DetailedMoon(props: MoonProps) {
  const tier = useGame((s) => s.tier)
  const color = useProgressiveTexture(assetUrl('moonColor2k'), tieredTexture('moonColor', TIERS[tier]))
  const normal = useTexture(assetUrl('moonNormal2k')) as Texture
  return <MoonSphere {...props} color={color} normal={normal} segments={192} />
}

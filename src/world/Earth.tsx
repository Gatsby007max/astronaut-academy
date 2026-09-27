import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, MathUtils, Quaternion, Vector3 } from 'three'
import { assetUrl, tieredTexture } from '../engine/assets'
import { TIERS } from '../engine/quality'
import { useProgressiveTexture } from '../engine/useProgressiveTexture'
import { useGame } from '../game/store'

interface EarthProps {
  position: Vector3
  radius: number
  sunDir: Vector3
  spin?: number
  subPoint?: [number, number]
  heading?: number
}

function orientation(latDeg: number, lonDeg: number, heading: number): Quaternion {
  const lat = MathUtils.degToRad(latDeg), lon = MathUtils.degToRad(lonDeg)
  const local = new Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon))
  const up = new Vector3(0, 1, 0)
  return new Quaternion().setFromAxisAngle(up, heading).multiply(new Quaternion().setFromUnitVectors(local, up))
}

/** NASA day albedo supplies the particle colors; no unused cloud/night passes. */
export function Earth({ position, radius, spin = 0.0011, subPoint = [33, 136], heading = 0.9 }: EarthProps) {
  const tier = useGame(s => s.tier)
  const day = useProgressiveTexture(assetUrl('earthDay2k'), tieredTexture('earthDay', TIERS[tier]))
  const orbit = useRef<Group>(null)
  const quaternion = useMemo(() => orientation(subPoint[0], subPoint[1], heading), [subPoint[0], subPoint[1], heading])
  // The orbital backdrop has a fixed sub-satellite point and a sampled cap.
  // Particle advection provides motion there; distant full globes may rotate.
  useFrame((_, delta) => { if (orbit.current && radius <= 100) orbit.current.rotation.x += delta * spin })
  return <group position={position}>
    <group ref={orbit} quaternion={quaternion}>
      <mesh userData={{ particleRole: 'planet' }}>
        <sphereGeometry args={[radius, 128, 64]} />
        <meshBasicMaterial map={day} />
      </mesh>
    </group>
  </group>
}

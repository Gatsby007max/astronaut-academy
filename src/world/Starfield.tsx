import { BackSide } from 'three'
import { assetUrl } from '../engine/assets'
import { useProgressiveTexture } from '../engine/useProgressiveTexture'

export function Starfield({ radius = 15000, intensity = 0.08 }: { radius?: number; intensity?: number }) {
  const map = useProgressiveTexture(assetUrl('stars2k'), undefined, { anisotropy: 4 })
  return (
    <mesh userData={{ particleMode: 'background' }} renderOrder={-10} rotation={[0.4, 0, 0.9]}>
      <sphereGeometry args={[radius, 64, 32]} />
      <meshBasicMaterial map={map} side={BackSide} depthWrite={false} color={[intensity, intensity, intensity]} />
    </mesh>
  )
}

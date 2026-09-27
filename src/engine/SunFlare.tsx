import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, Group, MathUtils, PerspectiveCamera, Ray, Sphere, Sprite, SpriteMaterial, Vector3 } from 'three'
import { useGame } from '../game/store'
import { TIERS } from './quality'
import { ghostTexture, glowTexture, ringTexture, streakTexture } from './textures'

interface SunFlareProps {
  position: Vector3
  occluders?: Sphere[]
  intensity?: number
}

const GHOSTS = [
  { t: 0.62, size: 0.035, color: '#6fb6ff', tex: 'ghost', opacity: 0.07 },
  { t: 0.3, size: 0.07, color: '#ffc27a', tex: 'ghost', opacity: 0.045 },
  { t: -0.12, size: 0.045, color: '#9dffcf', tex: 'ghost', opacity: 0.05 },
  { t: -0.45, size: 0.16, color: '#7aa8ff', tex: 'ring', opacity: 0.1 },
  { t: -0.8, size: 0.06, color: '#ff9f6f', tex: 'ghost', opacity: 0.04 },
] as const

export function SunFlare({ position, occluders = [], intensity = 1 }: SunFlareProps) {
  const tier = useGame((s) => s.tier)
  const group = useRef<Group>(null)
  const glow = useRef<Sprite>(null)
  const streak = useRef<Sprite>(null)
  const visibility = useRef(0)
  const tmp = useMemo(() => ({ ndc: new Vector3(), world: new Vector3(), dir: new Vector3(), ray: new Ray(), hit: new Vector3() }), [])

  const materials = useMemo(() => {
    const make = (map: ReturnType<typeof glowTexture>, color: string, opacity: number, depthTest = false, hdr = 1) => {
      const material = new SpriteMaterial({ map, color: new Color(color), transparent: true, opacity, blending: AdditiveBlending, depthTest, depthWrite: false, toneMapped: false })
      material.color.multiplyScalar(hdr)
      return material
    }
    return {
      glow: make(glowTexture(), '#ffe9cc', 1, true, 1.6),
      core: make(glowTexture(), '#ffffff', 1, true, 14),
      streak: make(streakTexture(), '#cfe6ff', 0.5),
      ghosts: GHOSTS.map((g) => make(g.tex === 'ring' ? ringTexture() : ghostTexture(), g.color, g.opacity)),
    }
  }, [])
  const core = useRef<Sprite>(null)

  useFrame(({ camera }, delta) => {
    if (!group.current) return
    const cam = camera as PerspectiveCamera
    tmp.ndc.copy(position).project(cam)
    const onScreen = tmp.ndc.z < 1 && Math.abs(tmp.ndc.x) < 1.3 && Math.abs(tmp.ndc.y) < 1.3
    tmp.ray.origin.copy(cam.position)
    tmp.ray.direction.copy(position).sub(cam.position).normalize()
    const sunDistance = cam.position.distanceTo(position)
    let occluded = false
    for (const sphere of occluders) {
      const hit = tmp.ray.intersectSphere(sphere, tmp.hit)
      if (hit && hit.distanceTo(cam.position) < sunDistance) occluded = true
    }
    const target = onScreen && !occluded ? 1 : 0
    visibility.current = MathUtils.damp(visibility.current, target, 8, delta)
    const v = visibility.current * intensity

    if (glow.current && core.current) {
      glow.current.position.copy(position)
      core.current.position.copy(position)
      const s = sunDistance * 0.22
      glow.current.scale.set(s, s, 1)
      core.current.scale.set(s * 0.16, s * 0.16, 1)
    }

    const d = 1
    const halfH = Math.tan(MathUtils.degToRad(cam.fov / 2)) * d
    const place = (sprite: Sprite, t: number, size: number) => {
      tmp.world.set(tmp.ndc.x * t, tmp.ndc.y * t, 0.5).unproject(cam)
      tmp.dir.copy(tmp.world).sub(cam.position).normalize()
      sprite.position.copy(cam.position).addScaledVector(tmp.dir, d)
      sprite.scale.set(size * halfH * 2, size * halfH * 2, 1)
    }
    if (streak.current) {
      place(streak.current, 1, 1.4)
      streak.current.scale.y *= 0.25
      streak.current.material.opacity = 0.35 * v
    }
    group.current.children.forEach((child, i) => {
      if (i < 3) return
      const g = GHOSTS[i - 3]
      place(child as Sprite, g.t, g.size)
      ;(child as Sprite).material.opacity = g.opacity * v
    })
  })

  const flare = TIERS[tier].flare
  return (
    <group ref={group}>
      <sprite ref={glow} material={materials.glow} renderOrder={5} />
      <sprite ref={core} material={materials.core} renderOrder={6} />
      <sprite ref={streak} material={materials.streak} renderOrder={10} visible={flare} />
      {flare && materials.ghosts.map((m, i) => <sprite key={i} material={m} renderOrder={10} />)}
    </group>
  )
}

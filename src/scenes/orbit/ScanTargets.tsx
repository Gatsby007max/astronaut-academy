import { trt } from '../../i18n/tr'
import { Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { PerspectiveCamera, Ray, Vector2, Vector3 } from 'three'
import { audio } from '../../engine/audio'
import { SCAN_TARGETS, useOrbitScan } from '../../minigames/orbitScan'
import type { IssPart, IssPartKey } from '../../world/IssModel'
import { EARTH_CENTER, EARTH_RADIUS, SUN_DIR } from './layout'

const LETTERS = 'ABCDEFGHIJ'

function earthPoints(camera: PerspectiveCamera) {
  const ray = new Ray()
  const hit = new Vector3()
  const ndc = new Vector2()
  const found: Record<string, { p: Vector3; score: number }> = {}
  const consider = (id: string, p: Vector3, score: number) => {
    if (!found[id] || score < found[id].score) found[id] = { p: p.clone(), score }
  }
  let horizonY = -1
  for (let y = -0.85; y <= 0.4; y += 0.05) {
    for (let x = -0.8; x <= 0.8; x += 0.05) {
      ndc.set(x, y)
      ray.origin.copy(camera.position)
      ray.direction.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(camera.position).normalize()
      const sphere = { center: EARTH_CENTER, radius: EARTH_RADIUS }
      if (!ray.intersectSphere(sphere as never, hit)) continue
      if (Math.abs(x) < 0.05) horizonY = Math.max(horizonY, y)
      const n = hit.clone().sub(EARTH_CENTER).normalize()
      const ndl = n.dot(SUN_DIR)
      const center = Math.hypot(x, y + 0.4)
      if (Math.abs(ndl) < 0.04) consider('terminator', hit, center)
      if (ndl < -0.3) consider('night', hit, center + ndl)
      const view = camera.position.clone().sub(hit).normalize()
      const half = view.add(SUN_DIR).normalize()
      if (ndl > 0.25) consider('ocean', hit, -n.dot(half))
    }
  }
  if (horizonY > -1) {
    const dir = new Vector3(0, horizonY + 0.03, 0.5).unproject(camera).sub(camera.position).normalize()
    found.limb = { p: camera.position.clone().addScaledVector(dir, 60), score: 0 }
  }
  return Object.fromEntries(Object.entries(found).map(([k, v]) => [k, v.p]))
}

export function ScanTargets({ parts }: { parts: Record<IssPartKey, IssPart> }) {
  const status = useOrbitScan((s) => s.status)
  const visible = useOrbitScan((s) => s.visible)
  const pick = useOrbitScan((s) => s.pick)
  const armedAt = useRef(0)

  useFrame(({ camera, clock }) => {
    const state = useOrbitScan.getState()
    if (state.status !== 'arming') {
      armedAt.current = 0
      return
    }
    if (!armedAt.current) armedAt.current = clock.elapsedTime
    if (clock.elapsedTime - armedAt.current < 1.6) return
    const cam = camera as PerspectiveCamera
    const candidates: Record<string, Vector3> = {
      solar: parts.solar.center,
      radiators: parts.radiators.center,
      cupola: parts.cupola.center,
      destiny: parts.destiny.center,
      canadarm2: parts.canadarm2.center,
      ...earthPoints(cam),
    }
    const result: Record<string, [number, number, number]> = {}
    const ndc = new Vector3()
    for (const [id, p] of Object.entries(candidates)) {
      ndc.copy(p).project(cam)
      if (ndc.z < 1 && Math.abs(ndc.x) < 0.85 && Math.abs(ndc.y) < 0.85) result[id] = p.toArray() as [number, number, number]
    }
    state.begin(result)
  })

  if (status !== 'running' && status !== 'done') return null
  const offsets:Record<string,[number,number,number]> = {solar:[-.8,.55,0], radiators:[.7,.75,0],cupola:[.6,-.5,0],destiny:[.6,.15,.45],canadarm2:[-.55,.2,.4]}
  const ids = SCAN_TARGETS.map((t) => t.id).filter((id) => visible[id])
  return (
    <>
      {ids.map((id, i) => (
        <group key={id}>{offsets[id] && <Line points={[visible[id],visible[id].map((v,i)=>v+offsets[id][i]) as [number,number,number]]} color="#7fe3ff" transparent opacity={.55} lineWidth={1} />}<Html position={offsets[id] ? visible[id].map((v,i)=>v+offsets[id][i]) as [number,number,number] : visible[id]} center zIndexRange={[30, 20]} style={{ pointerEvents: status === 'running' ? 'auto' : 'none' }}>
          <button
            type="button"
            aria-label={trt`3Dマーカー ${LETTERS[i]}`}
            onPointerEnter={() => audio.sfx('hover')}
            onClick={() => audio.sfx(pick(id) ? 'correct' : 'wrong')}
            className="group relative grid size-11 cursor-crosshair place-items-center"
          >
            <span className="absolute inset-0 rounded-full border border-hud/70 transition group-hover:scale-125 group-hover:border-amber" />
            <span className="absolute inset-2 animate-spin rounded-full border border-dashed border-hud/50 [animation-duration:6s]" />
            <span className="font-mono text-xs font-bold text-hud text-glow group-hover:text-amber">{LETTERS[i]}</span>
          </button>
        </Html></group>
      ))}
    </>
  )
}

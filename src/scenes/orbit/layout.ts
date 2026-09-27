import { tr } from '../../i18n/tr'
import { Sphere, Vector3 } from 'three'
import type { Shot } from '../../engine/CameraRig'
import type { CineShot } from '../../engine/Cinematic'
import type { ModuleId } from '../../content/types'
import type { IssPartKey } from '../../world/IssModel'

export const EARTH_RADIUS = 1000
export const ISS_ALTITUDE = 66
export const EARTH_CENTER = new Vector3(0, -(EARTH_RADIUS + ISS_ALTITUDE), 0)
export const SUN_DIR = new Vector3(-0.9, -0.1, -0.42).normalize()
export const SUN_POS = SUN_DIR.clone().multiplyScalar(12000)
export const MOON_DIR = new Vector3(0.55, 0.3, -0.78).normalize()
export const MOON_POS = MOON_DIR.clone().multiplyScalar(8000)
export const MOON_RADIUS = 36
export const EARTH_SPHERE = new Sphere(EARTH_CENTER, EARTH_RADIUS * 1.01)

export const MODULE_ANCHORS: Record<ModuleId, IssPartKey | [number, number, number]> = {
  orientation: 'unity',
  iss: 'destiny',
  medicine: 'harmony',
  eva: 'quest',
  robotics: 'canadarm2',
  t38: [-1.4, -1.5, 1.2],
  emergency: 'zvezda',
  lunar: MOON_DIR.clone().multiplyScalar(2.6).toArray() as [number, number, number],
  mcc: [1.2, -1.7, 0.9],
}

export const HUB_SHOTS: Record<string, Shot> = {
  overview: { position: [0.4, 1.9, 3.6], target: [0, -0.04, 0], fov: 40 },
  orientation: { position: [1.8, 0.9, 2.6], target: [0, 0, 0], fov: 40 },
  iss: { position: [2.4, 1.1, 2.2], target: [0.1, 0, 0], fov: 40 },
  medicine: { position: [2.8, 0.8, 2.4], target: [0.2, 0, 0.2], fov: 40 },
  eva: { position: [-1.6, 1.2, 2.8], target: [-0.2, 0, 0], fov: 40 },
  robotics: { position: [2.6, 1.8, 2.2], target: [0, 0.1, 0], fov: 40 },
  t38: { position: [2.5, 0.5, 5.5], target: [-1, -2.2, 0.5], fov: 44 },
  emergency: { position: [-2.8, 0.9, 2.6], target: [-0.6, 0, 0], fov: 40 },
  lunar: { position: [-1.4, 0.2, 2.2], target: MOON_POS.toArray() as [number, number, number], fov: 28 },
  mcc: { position: [3.2, 0.4, 5], target: [0.8, -2.2, 0.4], fov: 44 },
}

export const ORIENTATION_SHOTS: Record<string, Shot> = {
  overview: HUB_SHOTS.overview,
  iss: { position: [2.1, 0.7, 2.3], target: [0, 0, 0], fov: 40 },
  earth: { position: [0.6, 0.6, 3.2], target: [0, -40, -140], fov: 50 },
  moon: { position: [-0.6, 0.2, 1.6], target: MOON_POS.toArray() as [number, number, number], fov: 9 },
  sun: { position: [1.2, 0.4, 2.4], target: SUN_POS.toArray() as [number, number, number], fov: 50 },
  scan: { position: [2.2, 2.4, 5.6], target: [-0.6, -1.6, -3.5], fov: 58 },
}

export const TITLE_ORBIT = { radius: 7.5, height: 1.4, speed: 0.025 }

const v = (x: number, y: number, z: number): [number, number, number] => [x, y, z]

export const INTRO_SHOTS: CineShot[] = [
  {
    duration: 7,
    from: { position: v(30, 4, 40), target: v(-900, -260, -420), fov: 38 },
    to: { position: v(18, 2, 24), target: v(-900, -200, -420), fov: 38 },
    ease: 'linear',
    caption: { title: tr("高度 約400km"), subtitle: tr("秒速約7.7kmで地球を周回する") },
  },
  {
    duration: 7,
    from: { position: v(-12, 3, 18), target: v(0, 0, 0), fov: 30 },
    to: { position: v(-4.2, 1.2, 5.2), target: v(0, 0, 0), fov: 34 },
    fx: { dofFocus: 6, dofRange: 3, dofBokeh: 4 },
    caption: { title: tr("国際宇宙ステーション"), subtitle: 'International Space Station' },
  },
  {
    duration: 7,
    from: { position: v(-1.6, 0.6, 2.4), target: v(0.3, 0, 0), fov: 38 },
    to: { position: v(1.6, 0.9, 2.2), target: v(-0.2, -0.1, 0), fov: 38 },
    fx: { dofFocus: 2.6, dofRange: 1.4, dofBokeh: 5 },
    caption: { title: tr("あなたはNASA宇宙飛行士候補者に選ばれた"), subtitle: 'ASTRONAUT CANDIDATE' },
  },
  {
    duration: 6,
    from: { position: v(2.4, 1.2, 3), target: v(0, -0.2, 0), fov: 40 },
    to: { position: HUB_SHOTS.overview.position, target: HUB_SHOTS.overview.target, fov: 40 },
    fx: { dofFocus: 7, dofRange: 6, dofBokeh: 2 },
    caption: { title: tr("約2年間の訓練が、いま始まる"), subtitle: 'TRAINING BEGINS' },
  },
]

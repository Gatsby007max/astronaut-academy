import { Color } from 'three'
import type { Shot } from '../../engine/CameraRig'

export const POOL = { length: 62, width: 31, depth: 12.2 }
export const WATER_COLOR = new Color('#0b5270')
export const SUIT_HOME: [number, number, number] = [0.6, -5.2, 0.5]
export const AIRLOCK_HATCH: [number, number, number] = [-11.1, -9.9, -11]

export const EVA_SHOTS: Record<string, Shot> = {
  overview: { position: [6.5, -3.8, 8.5], target: [-0.5, -6.4, -3], fov: 52 },
  pool: { position: [14, -1.4, 13], target: [-2, -8, -8], fov: 60 },
  suit: { position: [2.4, -4.5, 3.4], target: [0.6, -5.2, 0.5], fov: 42 },
  mockup: { position: [5.5, -6.6, 1.5], target: [-1, -9.6, -11], fov: 50 },
  divers: { position: [-3.4, -4.4, 5], target: [-0.6, -5.2, 0.6], fov: 46 },
  airlock: { position: [-6.8, -8.4, -5.4], target: [-11.1, -9.9, -11], fov: 48 },
  weigh: { position: [0.6, -4.9, 7.4], target: [0.6, -5.1, 0.5], fov: 42 },
  prebreathe: { position: [-7.6, -8.6, -5.8], target: [-11.1, -9.7, -11], fov: 44 },
}

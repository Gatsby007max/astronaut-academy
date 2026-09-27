import { tr } from '../i18n/tr'
export type QualityTier = 'low' | 'medium' | 'high' | 'ultra'
export type QualitySetting = 'auto' | QualityTier

export interface TierConfig {
  label: string
  dpr: [number, number]
  post: boolean
  filmic: boolean
  flare: boolean
  dof: boolean
  shadows: boolean
  shadowMapSize: number
  texture: '2k' | '4k'
  particles: number
  terrainSegments: number
  issDetail: boolean
}

export const TIER_ORDER: QualityTier[] = ['low', 'medium', 'high', 'ultra']

export const TIERS: Record<QualityTier, TierConfig> = {
  low: {
    label: tr("低"),
    dpr: [0.7, 1],
    post: false,
    filmic: false,
    flare: false,
    dof: false,
    shadows: false,
    shadowMapSize: 512,
    texture: '2k',
    particles: 0.3,
    terrainSegments: 128,
    issDetail: false,
  },
  medium: {
    label: tr("中"),
    dpr: [1, 1.25],
    post: true,
    filmic: false,
    flare: true,
    dof: false,
    shadows: true,
    shadowMapSize: 1024,
    texture: '2k',
    particles: 0.6,
    terrainSegments: 192,
    issDetail: false,
  },
  high: {
    label: tr("高"),
    dpr: [1, 1.5],
    post: true,
    filmic: true,
    flare: true,
    dof: false,
    shadows: true,
    shadowMapSize: 2048,
    texture: '4k',
    particles: 1,
    terrainSegments: 256,
    issDetail: true,
  },
  ultra: {
    label: tr("最高"),
    dpr: [1, 2],
    post: true,
    filmic: true,
    flare: true,
    dof: true,
    shadows: true,
    shadowMapSize: 4096,
    texture: '4k',
    particles: 1.4,
    terrainSegments: 256,
    issDetail: true,
  },
}

export function detectInitialTier(): QualityTier {
  if (typeof navigator === 'undefined') return 'high'
  const ua = navigator.userAgent
  const touchMac = navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua) || touchMac
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  const cores = navigator.hardwareConcurrency ?? 8
  if (mobile) return 'low'
  if (cores <= 4 || memory <= 4) return 'medium'
  return 'high'
}

export function stepTier(tier: QualityTier, delta: 1 | -1, ceiling: QualityTier = 'high'): QualityTier {
  const index = TIER_ORDER.indexOf(tier) + delta
  const max = TIER_ORDER.indexOf(ceiling)
  return TIER_ORDER[Math.max(0, Math.min(max, index))]
}

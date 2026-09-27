import manifest from '../content/generated/assets.json'
import type { TierConfig } from './quality'

type Manifest = typeof manifest
export type AssetKey = keyof Manifest['assets']

export const ASSETS = manifest.assets
export const ASSET_SOURCES = manifest.sources

export const assetUrl = (key: AssetKey): string => `${import.meta.env.BASE_URL}${ASSETS[key].file.replace(/^\//, '')}`

export function tieredTexture(base: 'earthDay' | 'earthNight' | 'moonColor' | 'stars', tier: TierConfig): string {
  const key = `${base}${tier.texture}` as AssetKey
  return assetUrl(key in ASSETS ? key : (`${base}2k` as AssetKey))
}

export const LUNAR_TERRAIN = manifest.assets.lunarSouthPole

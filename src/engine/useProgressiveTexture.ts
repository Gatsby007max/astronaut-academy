import { useTexture } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { LoadingManager, SRGBColorSpace, TextureLoader, type Texture } from 'three'

interface Options {
  srgb?: boolean
  anisotropy?: number
}

const loader = new TextureLoader(new LoadingManager())
const upgraded = new Map<string, Promise<Texture>>()

function configure(texture: Texture, { srgb = true, anisotropy = 8 }: Options) {
  if (srgb) texture.colorSpace = SRGBColorSpace
  texture.anisotropy = anisotropy
  return texture
}

export function useProgressiveTexture(lowUrl: string, highUrl?: string, options: Options = {}): Texture {
  const low = useTexture(lowUrl, (t) => {
    for (const texture of Array.isArray(t) ? t : [t]) configure(texture, options)
  }) as Texture
  const [texture, setTexture] = useState<Texture>(low)

  useEffect(() => {
    setTexture(low)
    if (!highUrl || highUrl === lowUrl) return
    let alive = true
    let pending = upgraded.get(highUrl)
    if (!pending) {
      pending = loader.loadAsync(highUrl).then((t) => configure(t, options))
      upgraded.set(highUrl, pending)
    }
    const timer = window.setTimeout(() => {
      pending!.then((t) => alive && setTexture(t)).catch(() => undefined)
    }, 600)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [low, lowUrl, highUrl])

  return texture
}

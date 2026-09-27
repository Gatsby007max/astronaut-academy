import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

const cache = new Map<string, Texture>()

function canvasTexture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void, repeat = false): Texture {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  if (repeat) tex.wrapS = tex.wrapT = RepeatWrapping
  cache.set(key, tex)
  return tex
}

export const glowTexture = () =>
  canvasTexture('glow', 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.08, 'rgba(255,250,235,0.9)')
    g.addColorStop(0.25, 'rgba(255,220,170,0.28)')
    g.addColorStop(0.6, 'rgba(255,190,120,0.06)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })

export const ringTexture = () =>
  canvasTexture('ring', 256, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.72, 'rgba(120,200,255,0.0)')
    g.addColorStop(0.86, 'rgba(160,220,255,0.35)')
    g.addColorStop(0.93, 'rgba(255,200,160,0.18)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })

export const ghostTexture = () =>
  canvasTexture('ghost', 128, (ctx, s) => {
    ctx.translate(s / 2, s / 2)
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      ctx.lineTo(Math.cos(a) * s * 0.46, Math.sin(a) * s * 0.46)
    }
    ctx.closePath()
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.5)
    g.addColorStop(0, 'rgba(255,255,255,0.05)')
    g.addColorStop(0.8, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0.5)')
    ctx.fillStyle = g
    ctx.fill()
  })

export const streakTexture = () =>
  canvasTexture('streak', 512, (ctx, s) => {
    const g = ctx.createLinearGradient(0, s / 2, s, s / 2)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.5, 'rgba(200,230,255,0.9)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, s / 2 - 3, s, 6)
    const v = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    v.addColorStop(0, 'rgba(0,0,0,0)')
    v.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = v
    ctx.fillRect(0, 0, s, s)
  })

export const softParticleTexture = () =>
  canvasTexture('particle', 64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })

export const smokeTexture = () =>
  canvasTexture('smoke', 128, (ctx, s) => {
    for (let i = 0; i < 40; i++) {
      const x = s / 2 + (Math.random() - 0.5) * s * 0.5
      const y = s / 2 + (Math.random() - 0.5) * s * 0.5
      const r = s * (0.1 + Math.random() * 0.25)
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, 'rgba(255,255,255,0.12)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
    }
  })

export function panelTexture(key: string, draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 512): Texture {
  return canvasTexture(`panel:${key}`, size, draw)
}

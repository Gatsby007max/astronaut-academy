import sharp from 'sharp'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const source = join(root, 'launch/assets/cover-source-look-up.png')
const output = join(root, 'launch/assets/cover.png')

// Keep the supplied game screenshot intact. The lower band adds only typeset
// information needed for a 630 × 500 itch.io cover; it contains no generated art.
const screenshot = await sharp(source).resize(630, 355).png().toBuffer()
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="630" height="500" viewBox="0 0 630 500">
  <defs>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#03101b"/>
      <stop offset="1" stop-color="#061726"/>
    </linearGradient>
  </defs>
  <rect x="0" y="355" width="630" height="145" fill="url(#band)"/>
  <path d="M36 375 H594" stroke="#9dd6e4" stroke-width="1" opacity=".48"/>
  <text x="34" y="424" fill="#f4fbff" font-family="Helvetica,Arial,sans-serif" font-size="43" font-weight="800" letter-spacing="1">ASTRONAUT</text>
  <text x="34" y="468" fill="#b9eaff" font-family="Helvetica,Arial,sans-serif" font-size="43" font-weight="800" letter-spacing="1">ACADEMY</text>
  <text x="594" y="477" text-anchor="end" fill="#9cb8c6" font-family="Helvetica,Arial,sans-serif" font-size="9" font-weight="700" letter-spacing="2">GATSBYZERO</text>
</svg>`)

await sharp({ create: { width: 630, height: 500, channels: 4, background: '#03101b' } })
  .composite([
    { input: screenshot, top: 0, left: 0 },
    { input: overlay, top: 0, left: 0 },
  ])
  .png()
  .toFile(output)

console.log(output)

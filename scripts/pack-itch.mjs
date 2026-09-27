import { mkdir, readFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const html = await readFile('dist-itch/index.html', 'utf8')
if (!html.includes('./assets/') || html.includes('/astronaut-academy/assets/')) {
  throw new Error('itch build must use relative asset paths')
}
await mkdir('output', { recursive: true })
await rm('output/astronaut-academy-itch.zip', { force: true })
const result = spawnSync('zip', ['-q', '-r', '../output/astronaut-academy-itch.zip', '.'], { cwd: 'dist-itch', stdio: 'inherit' })
if (result.status !== 0) throw new Error(`zip failed: ${result.status}`)
console.log('output/astronaut-academy-itch.zip')

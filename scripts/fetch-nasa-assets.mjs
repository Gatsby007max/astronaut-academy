import { mkdir, stat, writeFile, rename } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOURCES } from './asset-sources.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'assets-src')

async function exists(path) {
  try {
    return (await stat(path)).size > 0
  } catch {
    return false
  }
}

async function download(source) {
  const target = join(outDir, source.file)
  if (await exists(target)) {
    console.log(`skip  ${source.file}`)
    return
  }
  const started = Date.now()
  const res = await fetch(source.url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`${source.id}: HTTP ${res.status} ${source.url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await writeFile(`${target}.part`, buffer)
  await rename(`${target}.part`, target)
  const mb = (buffer.length / 1e6).toFixed(1)
  console.log(`fetch ${source.file} ${mb} MB in ${((Date.now() - started) / 1000).toFixed(1)} s`)
}

await mkdir(outDir, { recursive: true })
const only = process.argv.slice(2)
const queue = SOURCES.filter((s) => only.length === 0 || only.includes(s.id))
const workers = Array.from({ length: 3 }, async () => {
  while (queue.length) await download(queue.shift())
})
await Promise.all(workers)
console.log('done')

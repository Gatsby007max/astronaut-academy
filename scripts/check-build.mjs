import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
const root = 'dist/'
const manifest = JSON.parse(await readFile(root + '.vite/manifest.json', 'utf8'))
const assets = JSON.parse(await readFile('public/assets/manifest.json', 'utf8')).assets
function dependencies(key, found = new Set()) {
  if (found.has(key)) return found
  found.add(key)
  for (const child of manifest[key].imports ?? []) dependencies(child, found)
  return found
}
async function sizes(keys) {
  const files = []
  for (const key of keys) {
    const file = manifest[key].file
    if (!file.endsWith('.js')) continue
    const body = await readFile(root + file)
    files.push({ file, bytes: body.length, gzipBytes: gzipSync(body, { level: 9 }).length })
  }
  return files
}
const entry = Object.keys(manifest).find(key => manifest[key].isEntry)
const initial = dependencies(entry)
const files = await sizes(initial)
const deferred = await sizes([...dependencies('src/scenes/orbit/Scene.tsx')].filter(key => !initial.has(key)))
const orbitAssets = ['iss', 'stars2k', 'earthDay2k', 'moonColor2k', 'earthDay4k']
const report = {
  checkedAt: new Date().toISOString(),
  initialJsGzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
  initialAssetBytes: assets.titleOrbit.bytes,
  initialJsBudgetBytes: 350000,
  initialAssetBudgetBytes: 4000000,
  firstSceneBudgetBytes: 6000000,
  firstSceneBytes: deferred.reduce((sum, file) => sum + file.gzipBytes, 0) + orbitAssets.reduce((sum, key) => sum + assets[key].bytes, 0),
  firstSceneBasis: 'High quality: deferred JS gzip level 9 plus raw optimized assets, including both progressive texture resolutions.',
  files,
  deferredFiles: deferred,
  orbitAssets,
  models: Object.fromEntries(['iss', 'issHd', 'emu'].map(key => [key, assets[key]])),
}
await mkdir('output', { recursive: true })
await writeFile('output/build-size.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (report.initialJsGzipBytes > report.initialJsBudgetBytes || report.initialAssetBytes > report.initialAssetBudgetBytes || report.firstSceneBytes > report.firstSceneBudgetBytes) process.exitCode = 1
